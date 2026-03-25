"""
ASGI config for chess_competition project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chess_competition.settings')

application = get_asgi_application()
