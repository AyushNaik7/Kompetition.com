"""
URL configuration for chess_competition project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/chess/', include('chess_app.api_urls')),
    path('', include('chess_app.urls')),
]
