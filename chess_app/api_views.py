from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count, Case, When, FloatField
import requests
import re

from .models import ChessCompetition, ChessParticipant, ChessMatch, ChessResultSyncLog
from .serializers import (
    ChessCompetitionSerializer,
    ChessParticipantSerializer,
    ChessMatchSerializer,
    LeaderboardSerializer
)


class ChessCompetitionViewSet(viewsets.ModelViewSet):
    queryset = ChessCompetition.objects.all()
    serializer_class = ChessCompetitionSerializer

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
            serializer.save()
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
        
        serializer = ChessMatchSerializer(data=data)
        if serializer.is_valid():
            match = serializer.save()
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
    def sync_result(self, request, pk=None):
        """Sync match result from Lichess"""
        match = self.get_object()
        
        # Check if match is already completed
        if match.status == 'completed':
            return Response(
                {'error': 'Match is already completed. Admin override required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get game ID from match or request
        game_id = match.lichess_game_id
        if not game_id and 'lichess_game_id' in request.data:
            game_id = request.data['lichess_game_id']
            match.lichess_game_id = game_id
        
        if not game_id:
            return Response(
                {'error': 'No Lichess game ID provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract game ID from URL if needed
        if 'lichess.org' in game_id:
            game_id = game_id.split('/')[-1].split('?')[0]
            match.lichess_game_id = game_id
        
        # Fetch game data from Lichess
        try:
            result_data = self._fetch_lichess_game(game_id)
            
            # Update match
            match.result = result_data['result']
            match.status = 'completed'
            match.finished_at = timezone.now()
            match.result_source = 'api'
            
            # Determine winner
            if result_data['result'] == '1-0':
                match.winner = match.player1
            elif result_data['result'] == '0-1':
                match.winner = match.player2
            else:
                match.winner = None
            
            match.save()

            
            # Log sync
            ChessResultSyncLog.objects.create(
                match=match,
                source='api',
                success=True,
                result_data=str(result_data)
            )
            
            return Response({
                'message': 'Result synced successfully',
                'result': match.result,
                'winner': match.winner.full_name if match.winner else 'Draw'
            })
            
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

    def _fetch_lichess_game(self, game_id):
        """Fetch game data from Lichess API"""
        url = f'https://lichess.org/game/export/{game_id}'
        headers = {'Accept': 'application/json'}
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            raise Exception(f'Lichess API returned status {response.status_code}')
        
        game_data = response.json()
        
        # Extract result
        result = game_data.get('status')
        winner = game_data.get('winner')
        
        # Map Lichess result to our format
        if winner == 'white':
            result_str = '1-0'
        elif winner == 'black':
            result_str = '0-1'
        elif result in ['draw', 'stalemate']:
            result_str = '1/2-1/2'
        else:
            result_str = '*'
        
        return {
            'result': result_str,
            'status': result,
            'winner': winner
        }
