from django.urls import path
from . import views

urlpatterns = [
    path('', views.competition_list, name='competition_list'),
    path('competitions/', views.competition_list, name='competition_list'),
    path('competitions/create/', views.competition_create, name='competition_create'),
    path('competitions/<slug:slug>/', views.competition_detail, name='competition_detail'),
    path('competitions/<slug:slug>/edit/', views.competition_edit, name='competition_edit'),
    path('competitions/<slug:slug>/register/', views.participant_register, name='participant_register'),
    path('competitions/<slug:slug>/matches/create/', views.match_create, name='match_create'),
    path('competitions/<slug:slug>/leaderboard/', views.leaderboard, name='leaderboard'),
    path('matches/<int:pk>/', views.match_detail, name='match_detail'),
]
