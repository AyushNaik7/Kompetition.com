from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import ChessCompetitionViewSet, ChessMatchViewSet

router = DefaultRouter()
router.register(r'competitions', ChessCompetitionViewSet, basename='competition')
router.register(r'matches', ChessMatchViewSet, basename='match')

urlpatterns = [
    path('', include(router.urls)),
]
