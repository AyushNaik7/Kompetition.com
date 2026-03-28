#!/usr/bin/env python
"""
Script to create a new chess competition
Usage: python create_competition.py
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chess_competition.settings')
django.setup()

from chess_app.models import ChessCompetition
from django.utils import timezone
from django.utils.text import slugify


def create_competition():
    """Interactive script to create a competition"""
    print("\n=== Create New Chess Competition ===\n")
    
    # Get competition details
    title = input("Competition Title: ").strip()
    if not title:
        print("Error: Title is required")
        return
    
    slug = input(f"Slug (press Enter for auto: '{slugify(title)}'): ").strip()
    if not slug:
        slug = slugify(title)
    
    description = input("Description: ").strip()
    if not description:
        description = f"Join the {title} and compete with players worldwide!"
    
    # Tournament type
    print("\nTournament Type:")
    print("1. Swiss System")
    print("2. Knockout")
    print("3. Round Robin")
    tournament_type_choice = input("Choose (1-3) [default: 1]: ").strip() or "1"
    tournament_type_map = {
        "1": "swiss",
        "2": "knockout",
        "3": "round_robin"
    }
    tournament_type = tournament_type_map.get(tournament_type_choice, "swiss")
    
    # Time control
    print("\nTime Control:")
    print("1. Bullet (1+0)")
    print("2. Blitz (3+2)")
    print("3. Blitz (5+3)")
    print("4. Rapid (10+5)")
    print("5. Rapid (15+10)")
    print("6. Custom")
    time_control_choice = input("Choose (1-6) [default: 2]: ").strip() or "2"
    time_control_map = {
        "1": "1+0",
        "2": "3+2",
        "3": "5+3",
        "4": "10+5",
        "5": "15+10"
    }
    if time_control_choice == "6":
        time_control = input("Enter custom time control (e.g., 10+0): ").strip()
    else:
        time_control = time_control_map.get(time_control_choice, "3+2")
    
    # Max participants
    max_participants = input("Max Participants [default: 16]: ").strip()
    max_participants = int(max_participants) if max_participants else 16
    
    # Start time
    print("\nStart Time:")
    print("1. Now")
    print("2. In 1 hour")
    print("3. Tomorrow")
    print("4. Custom")
    start_choice = input("Choose (1-4) [default: 1]: ").strip() or "1"
    
    now = timezone.now()
    if start_choice == "1":
        start_time = now
    elif start_choice == "2":
        start_time = now + timedelta(hours=1)
    elif start_choice == "3":
        start_time = now + timedelta(days=1)
    else:
        date_str = input("Enter start date/time (YYYY-MM-DD HH:MM): ").strip()
        try:
            start_time = timezone.make_aware(datetime.strptime(date_str, "%Y-%m-%d %H:%M"))
        except:
            print("Invalid format, using now")
            start_time = now
    
    # Duration
    duration_hours = input("Duration in hours [default: 4]: ").strip()
    duration_hours = int(duration_hours) if duration_hours else 4
    end_time = start_time + timedelta(hours=duration_hours)
    
    # Active status
    is_active = input("Is Active? (y/n) [default: y]: ").strip().lower() != 'n'
    
    # Create competition
    print("\n=== Creating Competition ===")
    print(f"Title: {title}")
    print(f"Slug: {slug}")
    print(f"Type: {tournament_type}")
    print(f"Time Control: {time_control}")
    print(f"Max Participants: {max_participants}")
    print(f"Start: {start_time}")
    print(f"End: {end_time}")
    print(f"Active: {is_active}")
    
    confirm = input("\nCreate this competition? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Cancelled")
        return
    
    try:
        competition = ChessCompetition.objects.create(
            title=title,
            slug=slug,
            description=description,
            tournament_type=tournament_type,
            time_control=time_control,
            max_participants=max_participants,
            start_time=start_time,
            end_time=end_time,
            is_active=is_active,
            match_type='1v1'
        )
        
        print(f"\n✅ Competition created successfully!")
        print(f"ID: {competition.id}")
        print(f"URL: http://localhost:3000/competitions/{competition.slug}")
        print(f"Admin URL: http://localhost:8000/admin/chess_app/chesscompetition/{competition.id}/change/")
        
    except Exception as e:
        print(f"\n❌ Error creating competition: {e}")


if __name__ == '__main__':
    create_competition()
