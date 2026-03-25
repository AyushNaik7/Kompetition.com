#!/usr/bin/env python
"""
Create demo data for Chess Competition Module
Run: python manage.py shell < create_demo_data.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chess_competition.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from chess_app.models import ChessCompetition, ChessParticipant, ChessMatch

print("Creating demo data...")

# Create competition
competition, created = ChessCompetition.objects.get_or_create(
    slug='sunday-blitz-battle',
    defaults={
        'title': 'Sunday Blitz Battle',
        'description': 'Weekly blitz chess tournament for all skill levels',
        'start_time': timezone.now(),
        'end_time': timezone.now() + timedelta(hours=8),
        'match_type': '1v1',
        'time_control': '3+2',
        'max_participants': 20,
        'is_active': True
    }
)

if created:
    print(f"✓ Created competition: {competition.title}")
else:
    print(f"✓ Competition already exists: {competition.title}")

# Create participants
participants_data = [
    {
        'full_name': 'Alice Johnson',
        'email': 'alice@example.com',
        'mobile_number': '+1234567890',
        'lichess_username': 'alicechess'
    },
    {
        'full_name': 'Bob Smith',
        'email': 'bob@example.com',
        'mobile_number': '+1234567891',
        'lichess_username': 'bobsmith'
    },
    {
        'full_name': 'Charlie Brown',
        'email': 'charlie@example.com',
        'mobile_number': '+1234567892',
        'lichess_username': 'charlieb'
    },
    {
        'full_name': 'Diana Prince',
        'email': 'diana@example.com',
        'mobile_number': '+1234567893',
        'lichess_username': 'dianaprince'
    }
]

participants = []
for data in participants_data:
    participant, created = ChessParticipant.objects.get_or_create(
        competition=competition,
        email=data['email'],
        defaults=data
    )
    participants.append(participant)
    if created:
        print(f"✓ Created participant: {participant.full_name}")
    else:
        print(f"✓ Participant already exists: {participant.full_name}")

# Create matches
if len(participants) >= 4:
    matches_data = [
        {
            'player1': participants[0],
            'player2': participants[1],
            'round_number': 1,
            'lichess_game_id': 'demo001',
            'status': 'pending'
        },
        {
            'player1': participants[2],
            'player2': participants[3],
            'round_number': 1,
            'lichess_game_id': 'demo002',
            'status': 'pending'
        }
    ]
    
    for data in matches_data:
        match, created = ChessMatch.objects.get_or_create(
            competition=competition,
            player1=data['player1'],
            player2=data['player2'],
            round_number=data['round_number'],
            defaults=data
        )
        if created:
            print(f"✓ Created match: {match}")
        else:
            print(f"✓ Match already exists: {match}")

print("\n" + "="*50)
print("Demo data created successfully!")
print("="*50)
print(f"\nCompetition URL: http://localhost:8000/competitions/{competition.slug}/")
print(f"Admin URL: http://localhost:8000/admin/")
print(f"API URL: http://localhost:8000/api/chess/competitions/{competition.id}/")
print("\nTo sync results, use real Lichess game IDs:")
print("Example: dKbV8Oba, q7ZvsdUF, GpYhZPz3")
