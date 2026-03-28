from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count, Case, When, FloatField
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
import requests
import re

from .models import ChessCompetition, ChessParticipant, ChessMatch, ChessResultSyncLog, UserProfile
from .serializers import (
    ChessCompetitionSerializer,
    ChessParticipantSerializer,
    ChessMatchSerializer,
    LeaderboardSerializer,
    UserSerializer,
    RegisterSerializer,
    LoginSerializer
)


class ChessCompetitionViewSet(viewsets.ModelViewSet):
    queryset = ChessCompetition.objects.all()
    serializer_class = ChessCompetitionSerializer
    permission_classes = [AllowAny]  # Allow anyone to create competitions

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active competitions"""
        now = timezone.now()
        competitions = ChessCompetition.objects.filter(
            is_active=True,
            start_time__lte=now,
            end_time__gte=now
        )
        serializer = self.get_serializer(competitions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        """Register a participant for a competition"""
        competition = self.get_object()
        
        # Check if registration is open
        if not competition.is_registration_open():
            return Response(
                {'error': 'Registration is closed for this competition'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check max participants
        if competition.participant_count() >= competition.max_participants:
            return Response(
                {'error': 'Competition is full'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create participant
        data = request.data.copy()
        data['competition'] = competition.id

        serializer = ChessParticipantSerializer(data=data)
        if serializer.is_valid():
            participant = serializer.save()
            
            # If user is authenticated, save their Lichess username to profile
            if request.user.is_authenticated:
                try:
                    profile = request.user.profile
                    if not profile.lichess_username:
                        profile.lichess_username = participant.lichess_username
                        profile.save()
                except UserProfile.DoesNotExist:
                    # Create profile if it doesn't exist
                    UserProfile.objects.create(
                        user=request.user,
                        lichess_username=participant.lichess_username
                    )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Get participants for a competition"""
        competition = self.get_object()
        participants = competition.participants.all()
        serializer = ChessParticipantSerializer(participants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        """Get matches for a competition"""
        competition = self.get_object()
        matches = competition.matches.all()
        serializer = ChessMatchSerializer(matches, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def create_match(self, request, pk=None):
        """Create a match in a competition"""
        competition = self.get_object()
        
        data = request.data.copy()
        data['competition'] = competition.id
        
        # Anti-abuse check: Prevent self-pairing
        player1_id = data.get('player1')
        player2_id = data.get('player2')
        
        if player1_id and player2_id and str(player1_id) == str(player2_id):
            return Response(
                {'error': 'A player cannot be paired against themselves'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ChessMatchSerializer(data=data)
        if serializer.is_valid():
            match = serializer.save()
            
            # Optionally create Lichess challenge
            create_challenge = request.data.get('create_challenge', False)
            if create_challenge:
                from chess_app.lichess_api import create_match_challenge
                challenge_result = create_match_challenge(match)
                if challenge_result:
                    return Response({
                        **ChessMatchSerializer(match).data,
                        'challenge_created': True,
                        'challenge_url': challenge_result['challenge_url']
                    }, status=status.HTTP_201_CREATED)
            
            return Response(
                ChessMatchSerializer(match).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """Get leaderboard for a competition"""
        competition = self.get_object()
        leaderboard_data = self._calculate_leaderboard(competition)
        serializer = LeaderboardSerializer(leaderboard_data, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def generate_swiss_pairings(self, request, pk=None):
        """Generate Swiss pairings for the next round"""
        from .swiss_pairing import create_swiss_round, get_next_round_number
        
        competition = self.get_object()
        
        # Get next round number
        next_round = get_next_round_number(competition)
        
        # Check if there are any incomplete matches in previous rounds
        incomplete_matches = ChessMatch.objects.filter(
            competition=competition,
            status__in=['pending', 'active']
        ).count()
        
        if incomplete_matches > 0:
            return Response(
                {'error': f'Cannot generate next round. {incomplete_matches} matches are still incomplete.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate pairings
        try:
            result = create_swiss_round(competition, next_round)
            return Response({
                'message': f'Successfully created {result["matches_created"]} matches for Round {next_round}',
                'round_number': next_round,
                'matches_created': result['matches_created'],
                'bye_player': result['bye_player'],
                'matches': ChessMatchSerializer(result['pairings'], many=True).data
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to generate pairings: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


    def _calculate_leaderboard(self, competition):
        """Calculate leaderboard standings"""
        participants = competition.participants.all()
        leaderboard = []
        
        for participant in participants:
            matches_as_p1 = ChessMatch.objects.filter(
                competition=competition,
                player1=participant,
                status='completed'
            )
            matches_as_p2 = ChessMatch.objects.filter(
                competition=competition,
                player2=participant,
                status='completed'
            )
            
            wins = 0
            draws = 0
            losses = 0
            
            # Count results as player 1
            for match in matches_as_p1:
                if match.result == '1-0':
                    wins += 1
                elif match.result == '1/2-1/2':
                    draws += 1
                elif match.result == '0-1':
                    losses += 1
            
            # Count results as player 2
            for match in matches_as_p2:
                if match.result == '0-1':
                    wins += 1
                elif match.result == '1/2-1/2':
                    draws += 1
                elif match.result == '1-0':
                    losses += 1
            
            matches_played = wins + draws + losses
            points = wins * 1.0 + draws * 0.5
            
            leaderboard.append({
                'participant_id': participant.id,
                'participant_name': participant.full_name,
                'lichess_username': participant.lichess_username,
                'matches_played': matches_played,
                'wins': wins,
                'draws': draws,
                'losses': losses,
                'points': points,
                'registered_at': participant.registered_at
            })
        
        # Sort by points (desc), wins (desc), registration time (asc)
        leaderboard.sort(key=lambda x: (-x['points'], -x['wins'], x['registered_at']))
        
        # Add rank
        for i, entry in enumerate(leaderboard, 1):
            entry['rank'] = i
            del entry['registered_at']
        
        return leaderboard



class ChessMatchViewSet(viewsets.ModelViewSet):
    queryset = ChessMatch.objects.all()
    serializer_class = ChessMatchSerializer

    @action(detail=True, methods=['post'])
    def create_lichess_challenge(self, request, pk=None):
        """Create a Lichess challenge for this match"""
        from chess_app.lichess_api import create_match_challenge
        
        match = self.get_object()
        
        if not match.player2:
            return Response(
                {'error': 'Cannot create challenge for bye match'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if match.status == 'completed':
            return Response(
                {'error': 'Match is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = create_match_challenge(match)
        
        if result:
            return Response({
                'message': 'Challenge created successfully',
                'challenge_url': result['challenge_url'],
                'challenge_id': result['challenge_id']
            })
        else:
            return Response(
                {'error': 'Failed to create challenge on Lichess'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def sync_result(self, request, pk=None):
        """Sync match result from Lichess using our API integration"""
        match = self.get_object()
        
        # Check if match is already completed (with admin override option)
        admin_override = request.data.get('admin_override', False)
        
        if match.status == 'completed' and not admin_override:
            return Response(
                {'error': 'Match is locked. Contact admin to override.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get game ID from request
        lichess_game_id = request.data.get('lichess_game_id', '').strip()
        
        if not lichess_game_id:
            return Response(
                {'error': 'No Lichess game ID provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use our lichess_api module to sync the result
        from chess_app.lichess_api import extract_game_id_from_url, sync_game_result
        
        game_id = extract_game_id_from_url(lichess_game_id)
        
        if not game_id:
            return Response(
                {'error': 'Invalid Lichess game ID or URL'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success = sync_game_result(match, game_id)
            
            if success:
                # Log sync
                ChessResultSyncLog.objects.create(
                    match=match,
                    source='api',
                    success=True,
                    result_data=f'Game ID: {game_id}'
                )
                
                return Response({
                    'message': 'Result synced successfully',
                    'result': match.get_result_display(),
                    'winner': match.winner.full_name if match.winner else 'Draw',
                    'status': match.status
                })
            else:
                # Log failed sync
                ChessResultSyncLog.objects.create(
                    match=match,
                    source='api',
                    success=False,
                    error_message='Failed to sync game result'
                )
                
                return Response(
                    {'error': 'Failed to sync result. Please check the game ID and player usernames.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            # Log failed sync
            ChessResultSyncLog.objects.create(
                match=match,
                source='api',
                success=False,
                error_message=str(e)
            )
            
            return Response(
                {'error': f'Failed to sync result: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )




# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Create user profile
        UserProfile.objects.create(user=user)
        # Log the user in
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return Response({
                'user': UserSerializer(user).data,
                'message': 'Login successful'
            })
        else:
            return Response(
                {'error': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Logout user"""
    logout(request)
    return Response({'message': 'Logout successful'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_matches(request):
    """Get all matches for the current user's linked participants"""
    try:
        profile = request.user.profile
        matches = profile.get_all_matches()
        serializer = ChessMatchSerializer(matches, many=True)
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        return Response([], status=status.HTTP_200_OK)




# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Create user profile
        UserProfile.objects.create(user=user)
        # Log the user in
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return Response({
                'user': UserSerializer(user).data,
                'message': 'Login successful'
            })
        else:
            return Response(
                {'error': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Logout user"""
    logout(request)
    return Response({'message': 'Logout successful'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
def my_matches(request):
    """Get all matches for a Lichess username"""
    lichess_username = request.query_params.get('username', '').strip()
    
    if not lichess_username:
        return Response(
            {'error': 'Lichess username is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find all participants with this username
    participants = ChessParticipant.objects.filter(lichess_username__iexact=lichess_username)
    
    if not participants.exists():
        return Response([], status=status.HTTP_200_OK)
    
    # Get all matches for these participants
    matches = ChessMatch.objects.filter(
        Q(player1__in=participants) | Q(player2__in=participants)
    ).order_by('-created_at')
    
    serializer = ChessMatchSerializer(matches, many=True)
    return Response(serializer.data)
