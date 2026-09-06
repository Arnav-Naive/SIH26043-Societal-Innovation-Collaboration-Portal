from django.urls import path
from .views import TeamMilestonesView, MilestoneSubmitView, MilestoneApproveView

urlpatterns = [
    path('teams/<int:team_id>/milestones/', TeamMilestonesView.as_view(), name='team-milestones'),
    path('milestones/<int:pk>/submit/', MilestoneSubmitView.as_view(), name='milestone-submit'),
    path('milestones/<int:pk>/review/', MilestoneApproveView.as_view(), name='milestone-review'),
]
