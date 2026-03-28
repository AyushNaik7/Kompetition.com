"""
Background script to automatically sync results for ongoing matches
Run this with: python sync_ongoing_matches.py
"""

import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chess_competition.settings')
django.setup()

from chess_app.models import ChessMatch
from chess_app.lichess_api import sync_game_result

def sync_all_active_matches():
    """Sync results for all active matches"""
    active_matches = ChessMatch.objects.filter(
        status__in=['pending', 'active'],
        lichess_game_id__isnull=False
    ).exclude(lichess_game_id='')
    
    print(f"Found {active_matches.count()} active matches to check")
    
    for match in active_matches:
        print(f"\nChecking match {match.id}: {match.player1.full_name} vs {match.player2.full_name}")
        print(f"  Game ID: {match.lichess_game_id}")
        
        try:
            success = sync_game_result(match, match.lichess_game_id)
            if success:
                print(f"  ✓ Synced! Result: {match.result}, Winner: {match.winner.full_name if match.winner else 'Draw'}")
            else:
                print(f"  ⏳ Game still in progress or not found")
        except Exception as e:
            print(f"  ✗ Error: {e}")

if __name__ == '__main__':
    print("=" * 60)
    print("Kompetitions - Automatic Match Result Sync")
    print("=" * 60)
    print("\nThis script will check for ongoing matches every 30 seconds")
    print("Press Ctrl+C to stop\n")
    
    try:
        while True:
            sync_all_active_matches()
            print(f"\n{'=' * 60}")
            print("Waiting 30 seconds before next check...")
            print(f"{'=' * 60}\n")
            time.sleep(30)
    except KeyboardInterrupt:
        print("\n\nStopping sync script. Goodbye!")
