from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone


class ChessCompetition(models.Model):
    """Chess competition model"""
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=200)
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    match_type = models.CharField(max_length=10, default='1v1')
    time_control = models.CharField(max_length=20)
    max_participants = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return self.title

    def is_registration_open(self):
        now = timezone.now()
        return self.is_active and self.start_time <= now <= self.end_time

    def participant_count(self):
        return self.participants.count()


class ChessParticipant(models.Model):
    """Participant registration for a competition"""
    competition = models.ForeignKey(
        ChessCompetition,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    mobile_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$')]
    )
    lichess_username = models.CharField(max_length=50)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['competition', 'email']
        ordering = ['registered_at']

    def __str__(self):
        return f"{self.full_name} - {self.competition.title}"



class ChessMatch(models.Model):
    """Chess match between two participants"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    RESULT_CHOICES = [
        ('1-0', 'Player 1 Won'),
        ('0-1', 'Player 2 Won'),
        ('1/2-1/2', 'Draw'),
        ('*', 'No Result'),
    ]

    competition = models.ForeignKey(
        ChessCompetition,
        on_delete=models.CASCADE,
        related_name='matches'
    )
    player1 = models.ForeignKey(
        ChessParticipant,
        on_delete=models.CASCADE,
        related_name='matches_as_player1'
    )
    player2 = models.ForeignKey(
        ChessParticipant,
        on_delete=models.CASCADE,
        related_name='matches_as_player2'
    )
    round_number = models.IntegerField(default=1)
    lichess_game_id = models.CharField(max_length=20, blank=True, null=True)
    lichess_game_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    result = models.CharField(max_length=10, choices=RESULT_CHOICES, default='*')
    winner = models.ForeignKey(
        ChessParticipant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='won_matches'
    )
    result_source = models.CharField(max_length=20, default='manual')
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['competition', 'lichess_game_id']

    def __str__(self):
        return f"{self.player1.full_name} vs {self.player2.full_name}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.player1 == self.player2:
            raise ValidationError("Player 1 and Player 2 cannot be the same")



class ChessResultSyncLog(models.Model):
    """Log for result synchronization attempts"""
    match = models.ForeignKey(
        ChessMatch,
        on_delete=models.CASCADE,
        related_name='sync_logs'
    )
    sync_time = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=20)
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True, null=True)
    result_data = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-sync_time']

    def __str__(self):
        return f"Sync for {self.match} at {self.sync_time}"
