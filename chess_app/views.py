from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_http_methods
from django.db.models import Count, Q
from .models import ChessParticipant, ChessCompetition, ChessMatch


@require_http_methods(["GET"])
def api_root(request):
    """
    API root endpoint - provides information about the API
    """
    return JsonResponse({
        'message': 'Kompetitions Chess API',
        'version': '1.0',
        'frontend': 'http://localhost:3000',
        'endpoints': {
            'competitions': '/api/chess/competitions/',
            'admin': '/admin/',
            'api_docs': '/api/chess/',
        },
        'note': 'This is a REST API backend. Visit http://localhost:3000 for the frontend.'
    })


@login_required
@user_passes_test(lambda u: u.is_staff)
def participant_list(request):
    """List all participants with filtering"""
    participants = ChessParticipant.objects.select_related('competition').all()
    
    # Filtering
    competition_filter = request.GET.get('competition')
    username_filter = request.GET.get('username')
    
    if competition_filter:
        participants = participants.filter(competition_id=competition_filter)
    
    if username_filter:
        participants = participants.filter(
            lichess_username__icontains=username_filter
        )
    
    # Annotate with match count
    participants = participants.annotate(
        match_count=Count('matches_as_player1', distinct=True) + Count('matches_as_player2', distinct=True)
    )
    
    participants = participants.order_by('-registered_at')
    
    context = {
        'participants': participants,
        'total_count': participants.count(),
        'competitions': ChessCompetition.objects.all(),
        'filters': {
            'competition': competition_filter,
            'username': username_filter,
        }
    }
    
    return render(request, 'chess_app/participant_list.html', context)



@login_required
@user_passes_test(lambda u: u.is_staff)
def participant_history(request, participant_id):
    """Match history for a specific participant"""
    participant = get_object_or_404(ChessParticipant, pk=participant_id)
    
    # Get all matches
    matches = ChessMatch.objects.filter(
        Q(player1=participant) | Q(player2=participant)
    ).select_related('player1', 'player2', 'competition').order_by('-created_at')
    
    # Calculate statistics
    wins = 0
    losses = 0
    draws = 0
    
    for match in matches:
        if match.status != 'completed':
            continue
            
        if match.player1 == participant:
            if match.result == '1-0':
                wins += 1
            elif match.result == '0-1':
                losses += 1
            elif match.result == '1/2-1/2':
                draws += 1
        else:  # player2
            if match.result == '0-1':
                wins += 1
            elif match.result == '1-0':
                losses += 1
            elif match.result == '1/2-1/2':
                draws += 1
    
    total_matches = wins + losses + draws
    win_percentage = (wins / total_matches * 100) if total_matches > 0 else 0
    
    context = {
        'participant': participant,
        'matches': matches,
        'stats': {
            'wins': wins,
            'losses': losses,
            'draws': draws,
            'total': total_matches,
            'win_percentage': round(win_percentage, 1),
        }
    }
    
    return render(request, 'chess_app/participant_history.html', context)


def my_matches(request):
    """Public page for viewing matches by Lichess username"""
    lichess_username = request.GET.get('username', '').strip()
    matches_by_competition = {}
    stats = None
    participant_found = False
    
    if lichess_username:
        # Find all participants with this username
        participants = ChessParticipant.objects.filter(
            lichess_username__iexact=lichess_username
        ).select_related('competition')
        
        if participants.exists():
            participant_found = True
            
            # Get matches grouped by competition
            for participant in participants:
                matches = ChessMatch.objects.filter(
                    Q(player1=participant) | Q(player2=participant)
                ).select_related('player1', 'player2', 'competition').order_by('-created_at')
                
                if matches.exists():
                    matches_by_competition[participant.competition] = {
                        'participant': participant,
                        'matches': matches
                    }
            
            # Calculate overall statistics
            all_matches = ChessMatch.objects.filter(
                Q(player1__in=participants) | Q(player2__in=participants),
                status='completed'
            )
            
            wins = 0
            losses = 0
            draws = 0
            
            for match in all_matches:
                participant = participants.filter(
                    Q(pk=match.player1_id) | Q(pk=match.player2_id)
                ).first()
                
                if match.player1 == participant:
                    if match.result == '1-0':
                        wins += 1
                    elif match.result == '0-1':
                        losses += 1
                    elif match.result == '1/2-1/2':
                        draws += 1
                else:
                    if match.result == '0-1':
                        wins += 1
                    elif match.result == '1-0':
                        losses += 1
                    elif match.result == '1/2-1/2':
                        draws += 1
            
            total = wins + losses + draws
            win_percentage = (wins / total * 100) if total > 0 else 0
            
            stats = {
                'wins': wins,
                'losses': losses,
                'draws': draws,
                'total': total,
                'win_percentage': round(win_percentage, 1),
            }
    
    context = {
        'lichess_username': lichess_username,
        'matches_by_competition': matches_by_competition,
        'stats': stats,
        'participant_found': participant_found,
    }
    
    return render(request, 'chess_app/my_matches.html', context)


@login_required
@user_passes_test(lambda u: u.is_staff)
def match_list(request):
    """List all matches with filtering"""
    from django.contrib import messages
    
    matches = ChessMatch.objects.select_related(
        'competition', 'player1', 'player2'
    ).all()
    
    # Filtering
    competition_filter = request.GET.get('competition')
    participant_filter = request.GET.get('participant')
    result_filter = request.GET.get('result')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    if competition_filter:
        matches = matches.filter(competition_id=competition_filter)
    
    if participant_filter:
        matches = matches.filter(
            Q(player1__lichess_username__icontains=participant_filter) |
            Q(player2__lichess_username__icontains=participant_filter)
        )
    
    if result_filter:
        matches = matches.filter(result=result_filter)
    
    if date_from:
        matches = matches.filter(created_at__gte=date_from)
    
    if date_to:
        matches = matches.filter(created_at__lte=date_to)
    
    matches = matches.order_by('-created_at')
    
    context = {
        'matches': matches,
        'total_count': matches.count(),
        'competitions': ChessCompetition.objects.all(),
        'result_choices': ChessMatch.RESULT_CHOICES,
        'filters': {
            'competition': competition_filter,
            'participant': participant_filter,
            'result': result_filter,
            'date_from': date_from,
            'date_to': date_to,
        }
    }
    
    return render(request, 'chess_app/match_list.html', context)


@login_required
@user_passes_test(lambda u: u.is_staff)
def swiss_pairing(request, slug):
    """Generate Swiss-style pairings for next round"""
    from django.contrib import messages
    from django.shortcuts import redirect
    from django.db import models, transaction
    from .utils import generate_swiss_pairings, log_audit_action
    
    competition = get_object_or_404(ChessCompetition, slug=slug)
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                pairings = generate_swiss_pairings(competition)
                
                # Create matches
                round_number = ChessMatch.objects.filter(
                    competition=competition
                ).aggregate(models.Max('round_number'))['round_number__max'] or 0
                round_number += 1
                
                for pairing in pairings:
                    match = ChessMatch.objects.create(
                        competition=competition,
                        player1=pairing['player1'],
                        player2=pairing['player2'],
                        round_number=round_number,
                        status='pending'
                    )
                    
                    # Log audit entry
                    log_audit_action(
                        request,
                        'swiss_pairing',
                        match=match,
                        new_values={
                            'round_number': round_number,
                            'player1': pairing['player1'].lichess_username,
                            'player2': pairing['player2'].lichess_username if pairing['player2'] else 'BYE',
                        }
                    )
                
                messages.success(
                    request,
                    f'Created {len(pairings)} pairings for round {round_number}'
                )
                return redirect('competition_detail', slug=slug)
                
        except ValueError as e:
            messages.error(request, str(e))
            return redirect('competition_detail', slug=slug)
    
    # Preview pairings
    try:
        pairings = generate_swiss_pairings(competition)
        context = {
            'competition': competition,
            'pairings': pairings,
        }
        return render(request, 'chess_app/swiss_pairing.html', context)
    except ValueError as e:
        messages.error(request, str(e))
        return redirect('competition_detail', slug=slug)


@login_required
@user_passes_test(lambda u: u.is_staff)
def audit_log_list(request):
    """Display audit log with filtering"""
    from .models import AuditLog
    
    logs = AuditLog.objects.select_related(
        'admin_user', 'match', 'participant'
    ).all()
    
    # Filtering
    admin_filter = request.GET.get('admin')
    action_filter = request.GET.get('action')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    if admin_filter:
        logs = logs.filter(admin_user__username__icontains=admin_filter)
    
    if action_filter:
        logs = logs.filter(action_type=action_filter)
    
    if date_from:
        logs = logs.filter(timestamp__gte=date_from)
    
    if date_to:
        logs = logs.filter(timestamp__lte=date_to)
    
    logs = logs.order_by('-timestamp')
    
    context = {
        'logs': logs,
        'total_count': logs.count(),
        'action_choices': AuditLog.ACTION_CHOICES,
        'filters': {
            'admin': admin_filter,
            'action': action_filter,
            'date_from': date_from,
            'date_to': date_to,
        }
    }
    
    return render(request, 'chess_app/audit_log.html', context)


def knockout_bracket(request, slug):
    """Display knockout bracket visualization"""
    from django.contrib import messages
    from django.shortcuts import redirect
    from .utils import build_bracket_structure
    
    competition = get_object_or_404(ChessCompetition, slug=slug)
    
    if competition.tournament_type != 'knockout':
        messages.warning(request, 'This competition is not a knockout tournament')
        return redirect('competition_detail', slug=slug)
    
    # Build bracket structure
    bracket = build_bracket_structure(competition)
    
    context = {
        'competition': competition,
        'bracket': bracket,
    }
    
    return render(request, 'chess_app/knockout_bracket.html', context)


# Authentication Views
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from django.contrib import messages
from django.shortcuts import redirect


def register(request):
    """User registration"""
    from .models import UserProfile
    
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            
            # Create user profile
            UserProfile.objects.create(user=user)
            
            # Log in the user
            login(request, user)
            messages.success(request, 'Registration successful!')
            return redirect('dashboard')
    else:
        form = UserCreationForm()
    
    return render(request, 'chess_app/register.html', {'form': form})


def user_login(request):
    """User login"""
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back, {username}!')
                next_url = request.GET.get('next', 'dashboard')
                return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password')
    else:
        form = AuthenticationForm()
    
    return render(request, 'chess_app/login.html', {'form': form})


def user_logout(request):
    """User logout"""
    logout(request)
    messages.success(request, 'You have been logged out')
    return redirect('competition_list')


@login_required
def dashboard(request):
    """User dashboard showing linked participants and matches"""
    from .models import UserProfile
    
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    linked_participants = profile.linked_participants.all()
    
    # Get all matches for linked participants
    matches = profile.get_all_matches()[:20]  # Recent 20 matches
    
    # Get competitions
    competitions = ChessCompetition.objects.filter(
        participants__in=linked_participants
    ).distinct()
    
    context = {
        'profile': profile,
        'linked_participants': linked_participants,
        'matches': matches,
        'competitions': competitions,
    }
    
    return render(request, 'chess_app/dashboard.html', context)


@login_required
def link_participant(request):
    """Link Lichess username to user account"""
    from .models import UserProfile
    
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        lichess_username = request.POST.get('lichess_username', '').strip()
        
        if lichess_username:
            # Find participants with this username
            participants = ChessParticipant.objects.filter(
                lichess_username__iexact=lichess_username
            )
            
            if participants.exists():
                for participant in participants:
                    profile.linked_participants.add(participant)
                
                messages.success(
                    request,
                    f'Linked {participants.count()} participant(s) with username {lichess_username}'
                )
            else:
                messages.error(
                    request,
                    f'No participants found with username {lichess_username}'
                )
        
        return redirect('dashboard')
    
    context = {
        'profile': profile,
    }
    
    return render(request, 'chess_app/link_participant.html', context)


@login_required
def unlink_participant(request, participant_id):
    """Unlink a participant from user account"""
    from .models import UserProfile
    
    profile = request.user.profile
    participant = get_object_or_404(ChessParticipant, pk=participant_id)
    
    if participant in profile.linked_participants.all():
        profile.linked_participants.remove(participant)
        messages.success(request, f'Unlinked {participant.lichess_username}')
    
    return redirect('link_participant')


def competition_list(request):
    """List all competitions"""
    competitions = ChessCompetition.objects.filter(is_active=True).order_by('-start_time')
    
    context = {
        'competitions': competitions,
    }
    
    return render(request, 'chess_app/competition_list.html', context)


def competition_detail(request, slug):
    """Competition detail page"""
    competition = get_object_or_404(ChessCompetition, slug=slug)
    participants = competition.participants.all()
    matches = competition.matches.all().order_by('-created_at')[:10]
    
    context = {
        'competition': competition,
        'participants': participants,
        'recent_matches': matches,
        'participant_count': participants.count(),
    }
    
    return render(request, 'chess_app/competition_detail.html', context)
