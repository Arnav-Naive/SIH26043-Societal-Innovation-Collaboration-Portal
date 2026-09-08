from django.urls import path
from .views import TeamMilestonesView, MilestoneSubmitView, MilestoneApproveView, ProjectImpactView

urlpatterns = [
    path('teams/<int:team_id>/milestones/', TeamMilestonesView.as_view(), name='team-milestones'),
    path('teams/<int:team_id>/impact/', ProjectImpactView.as_view(), name='team-impact'),
    path('milestones/<int:pk>/submit/', MilestoneSubmitView.as_view(), name='milestone-submit'),
    path('milestones/<int:pk>/review/', MilestoneApproveView.as_view(), name='milestone-review'),
]
