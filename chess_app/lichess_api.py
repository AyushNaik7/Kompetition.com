"""
Lichess API Integration using Personal Access Token
Handles game creation, result syncing, and player verification
"""

import requests
from django.conf import settings
import json


def get_api_token():
    """Get the Lichess API token from settings"""
    return getattr(settings, 'LICHESS_API_TOKEN', '')


def get_api_headers():
    """Get headers for Lichess API requests"""
    token = get_api_token()
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }


def verify_lichess_username(username):
    """
    Verify that a Lichess username exists
    
    Args:
        username: Lichess username to verify
    
    Returns:
        dict: User data if exists, None otherwise
    """
    url = f'{settings.LICHESS_API_BASE}/user/{username}'
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error verifying username: {e}")
    
    return None


def get_game_data(game_id):
    """
    Fetch game data from Lichess
    
    Args:
        game_id: Lichess game ID (from URL like lichess.org/abc123)
    
    Returns:
        dict: Game data including players, result, moves, etc.
    """
    url = f'{settings.LICHESS_API_BASE}/game/{game_id}'
    headers = get_api_headers()
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching game data: {e}")
    
    return None


def create_challenge(opponent_username, time_control='10+0', rated=False, color='random'):
    """
    Create a challenge to another player
    
    Args:
        opponent_username: Lichess username to challenge
        time_control: Time control string (e.g., "10+0" = 10 min, 0 increment)
        rated: Whether the game should be rated
        color: 'white', 'black', or 'random'
    
    Returns:
        dict: Challenge data with URL and challenge ID, or None if failed
    """
    url = f'{settings.LICHESS_API_BASE}/challenge/{opponent_username}'
    headers = get_api_headers()
    
    # Parse time control
    try:
        parts = time_control.split('+')
        clock_limit = int(parts[0]) * 60  # Convert minutes to seconds
        clock_increment = int(parts[1]) if len(parts) > 1 else 0
    except:
        clock_limit = 600  # Default 10 minutes
        clock_increment = 0
    
    data = {
        'rated': rated,
        'clock.limit': clock_limit,
        'clock.increment': clock_increment,
        'color': color,
        'variant': 'standard',
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            result = response.json()
            # Extract challenge URL - it's in the 'url' field directly
            challenge_url = result.get('url', '')
            challenge_id = result.get('id', '')
            
            return {
                'challenge_id': challenge_id,
                'challenge_url': challenge_url,
                'full_response': result
            }
        else:
            print(f"Challenge creation failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error creating challenge: {e}")
    
    return None


def create_match_challenge(match):
    """
    Create a Lichess challenge for a match
    This creates a challenge from the API token owner to one of the players
    
    Args:
        match: ChessMatch instance
    
    Returns:
        dict: Challenge info or None
    """
    if not match.player2:
        return None  # Bye match
    
    # Get time control from competition
    time_control = match.competition.time_control
    
    # Challenge player2 (player1 will be the token owner or vice versa)
    # Since we can only challenge FROM the token owner, we challenge one player
    opponent = match.player2
    
    result = create_challenge(
        opponent_username=opponent.lichess_username,
        time_control=time_control,
        rated=False,
        color='random'
    )
    
    if result:
        # Update match with challenge info
        match.lichess_game_url = result['challenge_url']
        match.save()
        
        return result
    
    return None


def get_ongoing_games():
    """
    Get currently ongoing games for the authenticated account
    
    Returns:
        list: List of ongoing games
    """
    url = f'{settings.LICHESS_API_BASE}/account/playing'
    headers = get_api_headers()
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data.get('nowPlaying', [])
    except Exception as e:
        print(f"Error fetching ongoing games: {e}")
    
    return []


def get_user_games(username, max_games=10):
    """
    Get recent games for a user
    
    Args:
        username: Lichess username
        max_games: Maximum number of games to fetch
    
    Returns:
        list: List of game data
    """
    url = f'{settings.LICHESS_API_BASE}/games/user/{username}'
    headers = get_api_headers()
    params = {
        'max': max_games,
        'pgnInJson': 'false',
        'tags': 'true',
        'clocks': 'false',
        'evals': 'false',
        'opening': 'false'
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            # Response is NDJSON (newline-delimited JSON)
            games = []
            for line in response.text.strip().split('\n'):
                if line:
                    try:
                        games.append(json.loads(line))
                    except:
                        pass
            return games
    except Exception as e:
        print(f"Error fetching user games: {e}")
    
    return []


def sync_game_result(match, game_id):
    """
    Sync game result from Lichess to match
    
    Args:
        match: ChessMatch instance
        game_id: Lichess game ID
    
    Returns:
        bool: True if sync successful, False otherwise
    """
    game_data = get_game_data(game_id)
    
    if not game_data:
        return False
    
    try:
        # Get players
        white_username = game_data['players']['white']['user']['name'].lower()
        black_username = game_data['players']['black']['user']['name'].lower()
        
        # Verify players match
        player1_username = match.player1.lichess_username.lower()
        player2_username = match.player2.lichess_username.lower()
        
        # Determine which player is white/black
        if white_username == player1_username:
            white_player = match.player1
            black_player = match.player2
        elif white_username == player2_username:
            white_player = match.player2
            black_player = match.player1
        else:
            print(f"Player mismatch: Game has {white_username} vs {black_username}, Match has {player1_username} vs {player2_username}")
            return False
        
        # Get result
        status = game_data.get('status')
        winner_color = game_data.get('winner')  # 'white', 'black', or None for draw
        
        # Update match
        if winner_color == 'white':
            match.winner = white_player
            match.result = 'white_win'
        elif winner_color == 'black':
            match.winner = black_player
            match.result = 'black_win'
        else:
            match.winner = None
            match.result = 'draw'
        
        match.status = 'completed'
        match.lichess_game_url = f'https://lichess.org/{game_id}'
        match.save()
        
        return True
        
    except Exception as e:
        print(f"Error syncing game result: {e}")
        return False


def extract_game_id_from_url(url):
    """
    Extract game ID from Lichess URL
    
    Args:
        url: Lichess game URL (e.g., https://lichess.org/abc123xyz or lichess.org/abc123xyz)
    
    Returns:
        str: Game ID or None
    """
    if not url:
        return None
    
    # Remove protocol and domain
    url = url.replace('https://', '').replace('http://', '').replace('lichess.org/', '')
    
    # Remove any query parameters or fragments
    game_id = url.split('?')[0].split('#')[0].split('/')[0]
    
    return game_id if game_id else None


def get_account_info():
    """
    Get information about the authenticated account
    
    Returns:
        dict: Account information
    """
    url = f'{settings.LICHESS_API_BASE}/account'
    headers = get_api_headers()
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching account info: {e}")
    
    return None


def test_api_connection():
    """
    Test if API token is valid and working
    
    Returns:
        tuple: (success: bool, message: str)
    """
    account_info = get_account_info()
    
    if account_info:
        username = account_info.get('username', 'Unknown')
        return True, f"✓ Connected to Lichess as {username}"
    else:
        return False, "✗ Failed to connect to Lichess API. Check your token."
