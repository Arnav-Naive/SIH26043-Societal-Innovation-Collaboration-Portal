from django.urls import path
from .views import (
    UniversityListView, UniversityRecommendView,
    HEIAssignedChallengesView, FormTeamView, HEIChallengeActionView, HEIDashboardStatsView,
    HEIMyTeamsView, FacultyMyTeamsView, ProjectTeamDetailView, FacultyListView,
    HEIRegistrationView, AdminHEIApprovalView, AdminHEIActionView
)

urlpatterns = [
    path('', UniversityListView.as_view(), name='university-list'),
    path('faculties/', FacultyListView.as_view(), name='faculty-list'),
    path('<int:challenge_id>/recommend/', UniversityRecommendView.as_view(), name='university-recommend'),
    path('dashboard/stats/', HEIDashboardStatsView.as_view(), name='hei-dashboard-stats'),
    path('assigned-challenges/', HEIAssignedChallengesView.as_view(), name='hei-assigned'),
    path('challenges/<int:challenge_id>/action/', HEIChallengeActionView.as_view(), name='hei-challenge-action'),
    path('challenges/<int:challenge_id>/form-team/', FormTeamView.as_view(), name='form-team'),
    path('my-teams/', HEIMyTeamsView.as_view(), name='hei-my-teams'),
    path('faculty-teams/', FacultyMyTeamsView.as_view(), name='faculty-teams'),
    path('teams/<int:pk>/', ProjectTeamDetailView.as_view(), name='team-detail'),
    path('register/', HEIRegistrationView.as_view(), name='hei-register'),
    path('pending/', AdminHEIApprovalView.as_view(), name='hei-pending'),
    path('<int:pk>/action/', AdminHEIActionView.as_view(), name='hei-action'),
]
