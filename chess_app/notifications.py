"""
Notification system for match pairings and updates
"""

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string


def send_match_pairing_notification(match):
    """
    Send email notification to both players when they're paired for a match
    
    Args:
        match: ChessMatch instance
    """
    if not match.player2:
        # Bye match, only notify player1
        send_bye_notification(match.player1, match)
        return
    
    # Send to both players
    send_player_notification(match.player1, match, is_player1=True)
    send_player_notification(match.player2, match, is_player1=False)


def send_player_notification(participant, match, is_player1=True):
    """
    Send notification to a single player
    
    Args:
        participant: ChessParticipant instance
        match: ChessMatch instance
        is_player1: bool, whether this is player1 or player2
    """
    opponent = match.player2 if is_player1 else match.player1
    
    subject = f"Match Pairing: {match.competition.title} - Round {match.round_number}"
    
    # Create match URL
    match_url = f"http://localhost:3000/matches/{match.id}"
    
    # If challenge URL exists, use it; otherwise show friend challenge link
    if match.lichess_game_url:
        challenge_link = match.lichess_game_url
        challenge_text = f"""
CHALLENGE READY! Click here to accept and play:
{challenge_link}

This is an official tournament challenge. Click the link above to accept it on Lichess.
"""
    else:
        challenge_link = f"https://lichess.org/?user={opponent.lichess_username}#friend"
        challenge_text = f"""
To play your match:
1. Go to Lichess: {challenge_link}
2. Challenge {opponent.lichess_username} to a game
3. Use time control: {match.competition.time_control}
4. Play your match!
"""
    
    message = f"""
Hello {participant.full_name},

You've been paired for Round {match.round_number} of {match.competition.title}!

Your opponent: {opponent.full_name} (@{opponent.lichess_username})
Time Control: {match.competition.time_control}

{challenge_text}

View match details: {match_url}

Good luck!

---
Kompetitions Chess Platform
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@kompetitions.com',
            recipient_list=[participant.email],
            fail_silently=True,
        )
        print(f"✓ Sent notification to {participant.email}")
    except Exception as e:
        print(f"✗ Failed to send notification to {participant.email}: {e}")


def send_bye_notification(participant, match):
    """
    Send notification to player who gets a bye
    
    Args:
        participant: ChessParticipant instance
        match: ChessMatch instance
    """
    subject = f"Bye Round: {match.competition.title} - Round {match.round_number}"
    
    message = f"""
Hello {participant.full_name},

You have a BYE for Round {match.round_number} of {match.competition.title}.

This means you automatically receive 1 point for this round without playing.

You'll be paired for the next round based on the current standings.

---
Kompetitions Chess Platform
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@kompetitions.com',
            recipient_list=[participant.email],
            fail_silently=True,
        )
        print(f"✓ Sent bye notification to {participant.email}")
    except Exception as e:
        print(f"✗ Failed to send bye notification to {participant.email}: {e}")


def send_result_notification(match):
    """
    Send notification when match result is synced
    
    Args:
        match: ChessMatch instance
    """
    if not match.player2:
        return  # Bye match, no notification needed
    
    subject = f"Match Result: {match.competition.title} - Round {match.round_number}"
    
    winner_text = f"Winner: {match.winner.full_name}" if match.winner else "Draw"
    
    message = f"""
Match result has been recorded:

{match.player1.full_name} vs {match.player2.full_name}
Result: {match.result}
{winner_text}

View leaderboard: http://localhost:3000/competitions/{match.competition.slug}

---
Kompetitions Chess Platform
"""
    
    recipients = [match.player1.email, match.player2.email]
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@kompetitions.com',
            recipient_list=recipients,
            fail_silently=True,
        )
        print(f"✓ Sent result notification to {len(recipients)} players")
    except Exception as e:
        print(f"✗ Failed to send result notification: {e}")


def notify_round_start(competition, round_number):
    """
    Send notification to all participants that a new round has started
    
    Args:
        competition: ChessCompetition instance
        round_number: int
    """
    subject = f"Round {round_number} Starting: {competition.title}"
    
    message = f"""
Round {round_number} of {competition.title} is now starting!

Check your match pairing and play your game on Lichess.

View matches: http://localhost:3000/competitions/{competition.slug}

Good luck!

---
Kompetitions Chess Platform
"""
    
    participants = competition.participants.all()
    recipient_list = [p.email for p in participants]
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@kompetitions.com',
            recipient_list=recipient_list,
            fail_silently=True,
        )
        print(f"✓ Sent round start notification to {len(recipient_list)} participants")
    except Exception as e:
        print(f"✗ Failed to send round start notification: {e}")
