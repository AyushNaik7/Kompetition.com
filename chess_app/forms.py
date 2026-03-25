from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import ChessCompetition, ChessParticipant, ChessMatch


class ChessCompetitionForm(forms.ModelForm):
    class Meta:
        model = ChessCompetition
        fields = [
            'title', 'slug', 'description', 'start_time', 'end_time',
            'match_type', 'time_control', 'max_participants', 'is_active'
        ]
        widgets = {
            'start_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'end_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'description': forms.Textarea(attrs={'rows': 4}),
        }

    def clean(self):
        cleaned_data = super().clean()
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')

        if start_time and end_time and start_time >= end_time:
            raise ValidationError("End time must be after start time")

        return cleaned_data


class ChessParticipantForm(forms.ModelForm):
    class Meta:
        model = ChessParticipant
        fields = ['full_name', 'email', 'mobile_number', 'lichess_username']
        widgets = {
            'full_name': forms.TextInput(attrs={'placeholder': 'John Doe'}),
            'email': forms.EmailInput(attrs={'placeholder': 'john@example.com'}),
            'mobile_number': forms.TextInput(attrs={'placeholder': '+1234567890'}),
            'lichess_username': forms.TextInput(attrs={'placeholder': 'johndoe'}),
        }

    def __init__(self, *args, **kwargs):
        self.competition = kwargs.pop('competition', None)
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = super().clean()
        if self.competition:
            # Check if competition is open for registration
            if not self.competition.is_registration_open():
                raise ValidationError("Registration is closed for this competition")

            # Check if participant already registered
            email = cleaned_data.get('email')
            if email and ChessParticipant.objects.filter(
                competition=self.competition,
                email=email
            ).exists():
                raise ValidationError("You have already registered for this competition")

        return cleaned_data


class ChessMatchForm(forms.ModelForm):
    class Meta:
        model = ChessMatch
        fields = [
            'player1', 'player2', 'round_number',
            'lichess_game_id', 'lichess_game_url', 'status'
        ]

    def __init__(self, *args, **kwargs):
        self.competition = kwargs.pop('competition', None)
        super().__init__(*args, **kwargs)
        
        if self.competition:
            # Limit player choices to registered participants
            participants = ChessParticipant.objects.filter(competition=self.competition)
            self.fields['player1'].queryset = participants
            self.fields['player2'].queryset = participants

    def clean(self):
        cleaned_data = super().clean()
        player1 = cleaned_data.get('player1')
        player2 = cleaned_data.get('player2')

        if player1 and player2 and player1 == player2:
            raise ValidationError("Player 1 and Player 2 cannot be the same")

        # Check for duplicate game ID
        lichess_game_id = cleaned_data.get('lichess_game_id')
        if lichess_game_id and self.competition:
            existing = ChessMatch.objects.filter(
                competition=self.competition,
                lichess_game_id=lichess_game_id
            ).exclude(pk=self.instance.pk if self.instance else None)
            
            if existing.exists():
                raise ValidationError("This Lichess game ID is already used in this competition")

        return cleaned_data
