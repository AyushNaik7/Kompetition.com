from .models import AuditLog


def log_audit_action(request, action_type, match=None, participant=None, 
                     previous_values=None, new_values=None):
    """Create an audit log entry"""
    if not request.user.is_authenticated or not request.user.is_staff:
        return
    
    audit_context = getattr(request, 'audit_context', {})
    
    AuditLog.objects.create(
        admin_user=request.user,
        action_type=action_type,
        match=match,
        participant=participant,
        previous_values=previous_values,
        new_values=new_values,
        ip_address=audit_context.get('ip_address'),
        user_agent=audit_context.get('user_agent'),
    )


def calculate_participant_score(participant, competition):
    """Calculate Swiss score for a participant"""
    from django.db.models import Q
    from .models import ChessMatch
    
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
    """Generate Swiss-style pairings"""
    from .models import ChessParticipant, ChessMatch
    
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
        pair = tuple(sorted([match.player1_id, match.player2_id]))
        existing_pairings.add(pair)
    
    # Generate pairings
    pairings = []
    paired = set()
    
    for i, entry in enumerate(participant_scores):
        if entry['participant'].id in paired:
            continue
        
        # Try to pair with next available participant
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
                break
    
    # Handle bye if odd number
    if len(paired) < len(participants):
        unpaired = [p for p in participants if p.id not in paired]
        if len(unpaired) == 1:
            pairings.append({
                'player1': unpaired[0],
                'player2': None,  # Bye
                'score1': calculate_participant_score(unpaired[0], competition),
                'score2': None,
            })
    
    if not pairings:
        raise ValueError("Could not generate valid pairings")
    
    return pairings


def build_bracket_structure(competition):
    """Build bracket structure from matches"""
    import math
    from django.db.models import Max
    from .models import ChessMatch
    
    participants = list(competition.participants.all())
    participant_count = len(participants)
    
    # Determine bracket size (next power of 2)
    bracket_size = 2 ** math.ceil(math.log2(max(participant_count, 2)))
    
    # Get all matches ordered by round
    matches = ChessMatch.objects.filter(
        competition=competition
    ).select_related('player1', 'player2', 'winner').order_by('round_number', 'id')
    
    # Organize matches by round
    rounds = {}
    max_round = matches.aggregate(Max('round_number'))['round_number__max'] or 0
    
    for match in matches:
        round_num = match.round_number
        if round_num not in rounds:
            rounds[round_num] = []
        rounds[round_num].append(match)
    
    # Calculate round labels
    num_rounds = math.ceil(math.log2(bracket_size))
    round_labels = []
    for i in range(1, num_rounds + 1):
        if i == num_rounds:
            round_labels.append('Finals')
        elif i == num_rounds - 1:
            round_labels.append('Semifinals')
        elif i == num_rounds - 2:
            round_labels.append('Quarterfinals')
        else:
            round_labels.append(f'Round {i}')
    
    bracket = {
        'size': bracket_size,
        'rounds': rounds,
        'round_labels': round_labels,
        'num_rounds': num_rounds,
    }
    
    return bracket
