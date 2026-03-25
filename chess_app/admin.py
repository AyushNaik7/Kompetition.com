from django.contrib import admin
from .models import ChessCompetition, ChessParticipant, ChessMatch, ChessResultSyncLog


@admin.register(ChessCompetition)
class ChessCompetitionAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'start_time', 'end_time', 'is_active', 'participant_count']
    list_filter = ['is_active', 'start_time']
    search_fields = ['title', 'slug']
    prepopulated_fields = {'slug': ('title',)}


@admin.register(ChessParticipant)
class ChessParticipantAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'lichess_username', 'competition', 'registered_at']
    list_filter = ['competition', 'registered_at']
    search_fields = ['full_name', 'email', 'lichess_username']


@admin.register(ChessMatch)
class ChessMatchAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'competition', 'status', 'result', 'winner', 'round_number']
    list_filter = ['competition', 'status', 'result']
    search_fields = ['player1__full_name', 'player2__full_name', 'lichess_game_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ChessResultSyncLog)
class ChessResultSyncLogAdmin(admin.ModelAdmin):
    list_display = ['match', 'sync_time', 'source', 'success']
    list_filter = ['success', 'source', 'sync_time']
    readonly_fields = ['sync_time']
