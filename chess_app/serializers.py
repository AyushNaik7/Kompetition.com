from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
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


class UserSerializer(serializers.ModelSerializer):
    lichess_username = serializers.CharField(source='profile.lichess_username', read_only=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'lichess_username']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
