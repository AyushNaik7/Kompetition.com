# Generated migration for performance indexes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chess_app', '0005_alter_chessmatch_player2'),
    ]

    operations = [
        # Add index on ChessParticipant.lichess_username for faster username lookups
        migrations.AddIndex(
            model_name='chessparticipant',
            index=models.Index(fields=['lichess_username'], name='chess_app_p_lichess_idx'),
        ),
        # Add composite index on ChessMatch (competition, created_at) for competition match queries
        migrations.AddIndex(
            model_name='chessmatch',
            index=models.Index(fields=['competition', '-created_at'], name='chess_app_m_comp_created_idx'),
        ),
        # Add composite index on ChessMatch (player1, created_at) for player1 match queries
        migrations.AddIndex(
            model_name='chessmatch',
            index=models.Index(fields=['player1', '-created_at'], name='chess_app_m_p1_created_idx'),
        ),
        # Add composite index on ChessMatch (player2, created_at) for player2 match queries
        migrations.AddIndex(
            model_name='chessmatch',
            index=models.Index(fields=['player2', '-created_at'], name='chess_app_m_p2_created_idx'),
        ),
    ]
