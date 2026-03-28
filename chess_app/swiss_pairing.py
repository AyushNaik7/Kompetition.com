"""
Swiss-style pairing system for chess tournaments.

Implements the Swiss pairing algorithm where participants with similar scores
are paired together, preventing rematches.
"""

from django.db.models import Q
from .models import ChessMatch, ChessParticipant


def calculate_participant_score(participant, competition):
    """
    Calculate Swiss score for a participant.
    
    Scoring:
    - Win: 1.0 point
    - Draw: 0.5 points
    - Loss: 0.0 points
    
    Args:
        participant: ChessParticipant instance
        competition: ChessCompetition instance
        
    Returns:
        float: Total score for the participant
    """
    matches = ChessMatch.objects.filter(
        Q(player1=participant) | Q(player2=participant),
        competition=competition,
        status='completed'
    )
    
    score = 0.0
    for match in matches:
        if match.player1 == participant:
            if match.result == '1-0':
                score += 1.0
            elif match.result == '1/2-1/2':
                score += 0.5
        else:  # player2
            if match.result == '0-1':
                score += 1.0
            elif match.result == '1/2-1/2':
                score += 0.5
    
    return score


def generate_swiss_pairings(competition):
    """
    Generate Swiss-style pairings for the next round.
    
    Algorithm:
    1. Calculate scores for all participants
    2. Sort participants by score (descending)
    3. Pair sequentially: 1st with 2nd, 3rd with 4th, etc.
    4. Avoid rematches (participants who already played)
    5. Assign bye to lowest-ranked participant if odd number
    
    Args:
        competition: ChessCompetition instance
        
    Returns:
        list: List of pairing dictionaries with player1, player2, scores
        
    Raises:
        ValueError: If less than 2 participants or no valid pairings exist
    """
    participants = list(competition.participants.all())
    
    if len(participants) < 2:
        raise ValueError("Need at least 2 participants for pairing")
    
    # Calculate scores for each participant
    participant_scores = []
    for participant in participants:
        score = calculate_participant_score(participant, competition)
        participant_scores.append({
            'participant': participant,
            'score': score
        })
    
    # Sort by score descending
    participant_scores.sort(key=lambda x: -x['score'])
    
    # Get existing pairings to avoid rematches
    existing_pairings = set()
    matches = ChessMatch.objects.filter(competition=competition)
    for match in matches:
        if match.player2:  # Skip byes
            pair = tuple(sorted([match.player1_id, match.player2_id]))
            existing_pairings.add(pair)
    
    # Generate pairings
    pairings = []
    paired = set()
    
    for i, entry in enumerate(participant_scores):
        if entry['participant'].id in paired:
            continue
        
        # Try to pair with next available participant
        paired_successfully = False
        for j in range(i + 1, len(participant_scores)):
            candidate = participant_scores[j]['participant']
            
            if candidate.id in paired:
                continue
            
            # Check if they've played before
            pair = tuple(sorted([entry['participant'].id, candidate.id]))
            if pair not in existing_pairings:
                pairings.append({
                    'player1': entry['participant'],
                    'player2': candidate,
                    'score1': entry['score'],
                    'score2': participant_scores[j]['score'],
                })
                paired.add(entry['participant'].id)
                paired.add(candidate.id)
                paired_successfully = True
                break
        
        # If couldn't pair, will handle as bye later
        if not paired_successfully and entry['participant'].id not in paired:
            # Mark as unpaired for now
            pass
    
    # Handle bye if odd number or unpaired participants
    unpaired = [p['participant'] for p in participant_scores if p['participant'].id not in paired]
    if unpaired:
        if len(unpaired) == 1:
            # Assign bye to the unpaired participant (lowest-ranked)
            pairings.append({
                'player1': unpaired[0],
                'player2': None,  # Bye
                'score1': calculate_participant_score(unpaired[0], competition),
                'score2': None,
            })
        else:
            # Multiple unpaired - this shouldn't happen in proper Swiss
            # Try to pair them with each other
            for i in range(0, len(unpaired), 2):
                if i + 1 < len(unpaired):
                    pairings.append({
                        'player1': unpaired[i],
                        'player2': unpaired[i + 1],
                        'score1': calculate_participant_score(unpaired[i], competition),
                        'score2': calculate_participant_score(unpaired[i + 1], competition),
                    })
                else:
                    # Last one gets a bye
                    pairings.append({
                        'player1': unpaired[i],
                        'player2': None,
                        'score1': calculate_participant_score(unpaired[i], competition),
                        'score2': None,
                    })
    
    if not pairings:
        raise ValueError("Could not generate valid pairings")
    
    return pairings


def get_participant_standings(competition):
    """
    Get current standings for all participants in a competition.
    
    Args:
        competition: ChessCompetition instance
        
    Returns:
        list: List of dictionaries with participant, score, wins, losses, draws
    """
    participants = competition.participants.all()
    standings = []
    
    for participant in participants:
        matches = ChessMatch.objects.filter(
            Q(player1=participant) | Q(player2=participant),
            competition=competition,
            status='completed'
        )
        
        wins = 0
        losses = 0
        draws = 0
        score = 0.0
        
        for match in matches:
            if match.player1 == participant:
                if match.result == '1-0':
                    wins += 1
                    score += 1.0
                elif match.result == '0-1':
                    losses += 1
                elif match.result == '1/2-1/2':
                    draws += 1
                    score += 0.5
            else:  # player2
                if match.result == '0-1':
                    wins += 1
                    score += 1.0
                elif match.result == '1-0':
                    losses += 1
                elif match.result == '1/2-1/2':
                    draws += 1
                    score += 0.5
        
        standings.append({
            'participant': participant,
            'score': score,
            'wins': wins,
            'losses': losses,
            'draws': draws,
            'total_games': wins + losses + draws,
        })
    
    # Sort by score descending
    standings.sort(key=lambda x: -x['score'])
    
    return standings
