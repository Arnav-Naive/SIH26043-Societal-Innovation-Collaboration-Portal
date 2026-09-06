from django.urls import path
from .views import (
    ChallengeSubmitView, CitizenChallengeListView, AdminChallengeListView,
    ChallengeDetailView, ChallengeReviewView, ChallengeRouteView,
    ChallengePriorityUpdateView, AllRolesChallengeListView,
)

urlpatterns = [
    path('submit/', ChallengeSubmitView.as_view(), name='challenge-submit'),
    path('my/', CitizenChallengeListView.as_view(), name='challenge-my'),
    path('all/', AdminChallengeListView.as_view(), name='challenge-all'),
    path('assigned/', AllRolesChallengeListView.as_view(), name='challenge-assigned'),
    path('<int:pk>/', ChallengeDetailView.as_view(), name='challenge-detail'),
    path('<int:pk>/review/', ChallengeReviewView.as_view(), name='challenge-review'),
    path('<int:pk>/route/', ChallengeRouteView.as_view(), name='challenge-route'),
    path('<int:pk>/priority/', ChallengePriorityUpdateView.as_view(), name='challenge-priority'),
]
