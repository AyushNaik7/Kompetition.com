from django.urls import path
from . import views

urlpatterns = [
    # API Root
    path('', views.api_root, name='api_root'),
    
    # Competition URLs
    path('competitions/', views.competition_list, name='competition_list'),
    path('competitions/<slug:slug>/', views.competition_detail, name='competition_detail'),
    path('competitions/<slug:slug>/bracket/', views.knockout_bracket, name='knockout_bracket'),
    path('competitions/<slug:slug>/swiss-pair/', views.swiss_pairing, name='swiss_pairing'),
    
    # Participant Management (Admin)
    path('participants/', views.participant_list, name='participant_list'),
    path('participants/<int:participant_id>/history/', views.participant_history, name='participant_history'),
    
    # Match Management (Admin)
    path('matches/', views.match_list, name='match_list'),
    
    # Audit Log (Admin)
    path('audit-log/', views.audit_log_list, name='audit_log_list'),
    
    # Public Pages
    path('my-matches/', views.my_matches, name='my_matches'),
    
    # Authentication URLs
    path('accounts/register/', views.register, name='register'),
    path('accounts/login/', views.user_login, name='login'),
    path('accounts/logout/', views.user_logout, name='logout'),
    path('accounts/dashboard/', views.dashboard, name='dashboard'),
    path('accounts/link-participant/', views.link_participant, name='link_participant'),
    path('accounts/unlink-participant/<int:participant_id>/', views.unlink_participant, name='unlink_participant'),
]
