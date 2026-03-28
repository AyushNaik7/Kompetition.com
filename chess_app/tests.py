from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import ChessCompetition, ChessParticipant, ChessMatch
from datetime import datetime, timedelta
from django.utils import timezone


class ParticipantListViewTests(TestCase):
    """Tests for participant list view"""
    
    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            password='testpass123',
            is_staff=True
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            username='regular',
            password='testpass123',
            is_staff=False
        )
        
        # Create competitions
        self.competition1 = ChessCompetition.objects.create(
            title='Test Competition 1',
            slug='test-comp-1',
            description='Test description',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(days=7),
            time_control='10+0',
            max_participants=20
        )
        
        self.competition2 = ChessCompetition.objects.create(
            title='Test Competition 2',
            slug='test-comp-2',
            description='Test description 2',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(days=7),
            time_control='5+3',
            max_participants=16
        )
        
        # Create participants
        self.participant1 = ChessParticipant.objects.create(
            competition=self.competition1,
            full_name='John Doe',
            email='john@example.com',
            mobile_number='+1234567890',
            lichess_username='johndoe'
        )
        
        self.participant2 = ChessParticipant.objects.create(
            competition=self.competition1,
            full_name='Jane Smith',
            email='jane@example.com',
            mobile_number='+1234567891',
            lichess_username='janesmith'
        )
        
        self.participant3 = ChessParticipant.objects.create(
            competition=self.competition2,
            full_name='Bob Wilson',
            email='bob@example.com',
            mobile_number='+1234567892',
            lichess_username='bobwilson'
        )
        
        self.client = Client()
    
    def test_participant_list_requires_login(self):
        """Test that participant list requires authentication"""
        response = self.client.get(reverse('participant_list'))
        self.assertEqual(response.status_code, 302)  # Redirect to login
    
    def test_participant_list_requires_staff(self):
        """Test that participant list requires staff privileges"""
        self.client.login(username='regular', password='testpass123')
        response = self.client.get(reverse('participant_list'))
        self.assertEqual(response.status_code, 302)  # Redirect (access denied)
    
    def test_participant_list_displays_all_participants(self):
        """Test that all participants are displayed"""
        self.client.login(username='admin', password='testpass123')
        response = self.client.get(reverse('participant_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'johndoe')
        self.assertContains(response, 'janesmith')
        self.assertContains(response, 'bobwilson')
    
    def test_participant_list_filter_by_competition(self):
        """Test filtering participants by competition"""
        self.client.login(username='admin', password='testpass123')
        response = self.client.get(
            reverse('participant_list'),
            {'competition': self.competition1.id}
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'johndoe')
        self.assertContains(response, 'janesmith')
        self.assertNotContains(response, 'bobwilson')
    
    def test_participant_list_filter_by_username(self):
        """Test filtering participants by username"""
        self.client.login(username='admin', password='testpass123')
        response = self.client.get(
            reverse('participant_list'),
            {'username': 'john'}
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'johndoe')
        self.assertNotContains(response, 'janesmith')
        self.assertNotContains(response, 'bobwilson')
    
    def test_participant_list_shows_total_count(self):
        """Test that total count is displayed"""
        self.client.login(username='admin', password='testpass123')
        response = self.client.get(reverse('participant_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Total Participants: 3')


class ParticipantHistoryViewTests(TestCase):
    """Tests for participant history view"""
    
    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            password='testpass123',
            is_staff=True
        )
        
        # Create competition
        self.competition = ChessCompetition.objects.create(
            title='Test Competition',
            slug='test-comp',
            description='Test description',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(days=7),
            time_control='10+0',
            max_participants=20
        )
        
        # Create participants
        self.participant1 = ChessParticipant.objects.create(
            competition=self.competition,
            full_name='John Doe',
            email='john@example.com',
            mobile_number='+1234567890',
            lichess_username='johndoe'
        )
        
        self.participant2 = ChessParticipant.objects.create(
            competition=self.competition,
            full_name='Jane Smith',
            email='jane@example.com',
            mobile_number='+1234567891',
            lichess_username='janesmith'
        )
        
        # Create matches
        self.match1 = ChessMatch.objects.create(
            competition=self.competition,
            player1=self.participant1,
            player2=self.participant2,
            status='completed',
            result='1-0'
        )
        
        self.match2 = ChessMatch.objects.create(
            competition=self.competition,
            player1=self.participant2,
            player2=self.participant1,
            status='completed',
            result='1/2-1/2'
        )
        
        self.client = Client()
    
    def test_participant_history_requires_login(self):
        """Test that participant history requires authentication"""
        response = self.client.get(
            reverse('participant_history', args=[self.participant1.id])
        )
        self.assertEqual(response.status_code, 302)  # Redirect to login
    
    def test_participant_history_displays_matches(self):
        """Test that participant history displays all matches"""
        self.client.login(username='admin', password='testpass123')
        response = self.client.get(
            reverse('participant_history', args=[self.participant1.id])
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'johndoe')
        self.assertContains(response, 'janesmith')
    
    def test_participant_history_calculates_stats(self):
        """Test that statistics are calculated correctly"""
        self.client.login(username='admin', password='testpass123')
        response = self.client.get(
            reverse('participant_history', args=[self.participant1.id])
        )
        self.assertEqual(response.status_code, 200)
        # participant1 has 1 win and 1 draw
        self.assertContains(response, '1')  # wins
        self.assertContains(response, '0')  # losses
        self.assertContains(response, '1')  # draws
    
    def test_participant_history_404_for_invalid_id(self):
        """Test that 404 is returned for invalid participant ID"""
        self.client.login(username='admin', password='testpass123')
        response = self.client.get(
            reverse('participant_history', args=[9999])
        )
        self.assertEqual(response.status_code, 404)
