from django.urls import path
from .views import (
    UniversityListView, UniversityRecommendView,
    HEIAssignedChallengesView, FormTeamView,
    HEIMyTeamsView, FacultyMyTeamsView, ProjectTeamDetailView, FacultyListView,
)

urlpatterns = [
    path('', UniversityListView.as_view(), name='university-list'),
    path('faculties/', FacultyListView.as_view(), name='faculty-list'),
    path('<int:challenge_id>/recommend/', UniversityRecommendView.as_view(), name='university-recommend'),
    path('assigned-challenges/', HEIAssignedChallengesView.as_view(), name='hei-assigned'),
    path('challenges/<int:challenge_id>/form-team/', FormTeamView.as_view(), name='form-team'),
    path('my-teams/', HEIMyTeamsView.as_view(), name='hei-my-teams'),
    path('faculty-teams/', FacultyMyTeamsView.as_view(), name='faculty-teams'),
    path('teams/<int:pk>/', ProjectTeamDetailView.as_view(), name='team-detail'),
]
