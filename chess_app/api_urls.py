from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    ChessCompetitionViewSet, 
    ChessMatchViewSet,
    register_user,
    login_user,
    logout_user,
    current_user,
    my_matches
)

router = DefaultRouter()
router.register(r'competitions', ChessCompetitionViewSet, basename='competition')
router.register(r'matches', ChessMatchViewSet, basename='match')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register_user, name='register'),
    path('auth/login/', login_user, name='login'),
    path('auth/logout/', logout_user, name='logout'),
    path('auth/me/', current_user, name='current-user'),
    path('my-matches/', my_matches, name='my-matches'),
]
