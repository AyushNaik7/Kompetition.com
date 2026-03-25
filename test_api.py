#!/usr/bin/env python
"""
Test script for Chess Competition API
Run after setting up the database and creating sample data
"""

import requests
import json

BASE_URL = 'http://localhost:8000/api/chess'

def test_active_competitions():
    """Test getting active competitions"""
    print("\n=== Testing Active Competitions ===")
    response = requests.get(f'{BASE_URL}/competitions/active/')
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_register_participant():
    """Test participant registration"""
    print("\n=== Testing Participant Registration ===")
    data = {
        'full_name': 'Test Player',
        'email': 'test@example.com',
        'mobile_number': '+1234567890',
        'lichess_username': 'testplayer'
    }
    response = requests.post(f'{BASE_URL}/competitions/1/register/', json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_create_match():
    """Test match creation"""
    print("\n=== Testing Match Creation ===")
    data = {
        'player1': 1,
        'player2': 2,
        'round_number': 1,
        'lichess_game_id': 'dKbV8Oba',
        'status': 'pending'
    }
    response = requests.post(f'{BASE_URL}/competitions/1/create_match/', json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_sync_result():
    """Test result synchronization"""
    print("\n=== Testing Result Sync ===")
    data = {
        'lichess_game_id': 'dKbV8Oba'
    }
    response = requests.post(f'{BASE_URL}/matches/1/sync_result/', json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_leaderboard():
    """Test leaderboard"""
    print("\n=== Testing Leaderboard ===")
    response = requests.get(f'{BASE_URL}/competitions/1/leaderboard/')
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

if __name__ == '__main__':
    print("Chess Competition API Test Script")
    print("Make sure the development server is running on localhost:8000")
    
    try:
        test_active_competitions()
        # Uncomment to test other endpoints
        # test_register_participant()
        # test_create_match()
        # test_sync_result()
        # test_leaderboard()
    except Exception as e:
        print(f"Error: {e}")
