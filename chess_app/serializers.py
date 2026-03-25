from rest_framework import serializers
from .models import ChessCompetition, ChessParticipant, ChessMatch


class ChessCompetitionSerializer(serializers.ModelSerializer):
    participant_count = serializers.IntegerField(read_only=True)
    is_registration_open = serializers.BooleanField(read_only=True)

    class Meta:
        model = ChessCompetition
        fields = '__all__'


class ChessParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChessParticipant
        fields = '__all__'
        read_only_fields = ['registered_at']


class ChessMatchSerializer(serializers.ModelSerializer):
    player1_name = serializers.CharField(source='player1.full_name', read_only=True)
    player2_name = serializers.CharField(source='player2.full_name', read_only=True)
    winner_name = serializers.CharField(source='winner.full_name', read_only=True)

    class Meta:
        model = ChessMatch
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class LeaderboardSerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    participant_id = serializers.IntegerField()
    participant_name = serializers.CharField()
    lichess_username = serializers.CharField()
    matches_played = serializers.IntegerField()
    wins = serializers.IntegerField()
    draws = serializers.IntegerField()
    losses = serializers.IntegerField()
    points = serializers.FloatField()
