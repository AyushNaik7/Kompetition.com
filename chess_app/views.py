from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.db.models import Q
from .models import ChessCompetition, ChessParticipant, ChessMatch
from .forms import ChessCompetitionForm, ChessParticipantForm, ChessMatchForm


def competition_list(request):
    """List all competitions"""
    competitions = ChessCompetition.objects.all()
    return render(request, 'chess_app/competition_list.html', {
        'competitions': competitions
    })


def competition_detail(request, slug):
    """Competition detail page"""
    competition = get_object_or_404(ChessCompetition, slug=slug)
    participants = competition.participants.all()
    matches = competition.matches.all()
    
    return render(request, 'chess_app/competition_detail.html', {
        'competition': competition,
        'participants': participants,
        'matches': matches
    })


def competition_create(request):
    """Create a new competition"""
    if request.method == 'POST':
        form = ChessCompetitionForm(request.POST)
        if form.is_valid():
            competition = form.save()
            messages.success(request, 'Competition created successfully!')
            return redirect('competition_detail', slug=competition.slug)
    else:
        form = ChessCompetitionForm()
    
    return render(request, 'chess_app/competition_form.html', {
        'form': form,
        'title': 'Create Competition'
    })


def competition_edit(request, slug):
    """Edit a competition"""
    competition = get_object_or_404(ChessCompetition, slug=slug)
    
    if request.method == 'POST':
        form = ChessCompetitionForm(request.POST, instance=competition)
        if form.is_valid():
            form.save()
            messages.success(request, 'Competition updated successfully!')
            return redirect('competition_detail', slug=competition.slug)
    else:
        form = ChessCompetitionForm(instance=competition)
    
    return render(request, 'chess_app/competition_form.html', {
        'form': form,
        'title': 'Edit Competition',
        'competition': competition
    })


def participant_register(request, slug):
    """Register for a competition"""
    competition = get_object_or_404(ChessCompetition, slug=slug)
    
    if request.method == 'POST':
        form = ChessParticipantForm(request.POST, competition=competition)
        if form.is_valid():
            participant = form.save(commit=False)
            participant.competition = competition
            participant.save()
            messages.success(request, 'Registration successful!')
            return redirect('competition_detail', slug=competition.slug)
    else:
        form = ChessParticipantForm(competition=competition)
    
    return render(request, 'chess_app/participant_register.html', {
        'form': form,
        'competition': competition
    })


def match_create(request, slug):
    """Create a match"""
    competition = get_object_or_404(ChessCompetition, slug=slug)
    
    if request.method == 'POST':
        form = ChessMatchForm(request.POST, competition=competition)
        if form.is_valid():
            match = form.save(commit=False)
            match.competition = competition
            match.save()
            messages.success(request, 'Match created successfully!')
            return redirect('competition_detail', slug=competition.slug)
    else:
        form = ChessMatchForm(competition=competition)
    
    return render(request, 'chess_app/match_form.html', {
        'form': form,
        'competition': competition
    })



def match_detail(request, pk):
    """Match detail page"""
    match = get_object_or_404(ChessMatch, pk=pk)
    
    return render(request, 'chess_app/match_detail.html', {
        'match': match
    })


def leaderboard(request, slug):
    """Competition leaderboard"""
    competition = get_object_or_404(ChessCompetition, slug=slug)
    
    # Calculate leaderboard
    participants = competition.participants.all()
    leaderboard_data = []
    
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
        
        for match in matches_as_p1:
            if match.result == '1-0':
                wins += 1
            elif match.result == '1/2-1/2':
                draws += 1
            elif match.result == '0-1':
                losses += 1
        
        for match in matches_as_p2:
            if match.result == '0-1':
                wins += 1
            elif match.result == '1/2-1/2':
                draws += 1
            elif match.result == '1-0':
                losses += 1
        
        matches_played = wins + draws + losses
        points = wins * 1.0 + draws * 0.5
        
        leaderboard_data.append({
            'participant': participant,
            'matches_played': matches_played,
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'points': points,
            'registered_at': participant.registered_at
        })
    
    leaderboard_data.sort(key=lambda x: (-x['points'], -x['wins'], x['registered_at']))
    
    for i, entry in enumerate(leaderboard_data, 1):
        entry['rank'] = i
    
    return render(request, 'chess_app/leaderboard.html', {
        'competition': competition,
        'leaderboard': leaderboard_data
    })
