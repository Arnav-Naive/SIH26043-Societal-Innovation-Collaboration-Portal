"""FILE PATH: backend/industry/urls.py  (REPLACE EXISTING FILE)"""
from django.urls import path
from .views import (
    BrowseProjectsView, OfferSupportView, PartnershipRespondView,
    MyPartnershipsView, TeamPartnershipsView,
    AssignMentorView, TeamMentorsView, AddMentorReviewView,
    ProjectDocumentListCreateView,
    TeamMilestonesForIndustryView,
    MyImpactSummaryView,
    AdminCreateIndustryView, AdminIndustryListView, AdminSetIndustryStatusView,
)

urlpatterns = [
    # Discovery & partnerships
    path('projects/', BrowseProjectsView.as_view(), name='industry-projects'),
    path('projects/<int:team_id>/offer-support/', OfferSupportView.as_view(), name='offer-support'),
    path('partnerships/<int:partnership_id>/respond/', PartnershipRespondView.as_view(), name='partnership-respond'),
    path('my-partnerships/', MyPartnershipsView.as_view(), name='my-partnerships'),
    path('teams/<int:team_id>/partnerships/', TeamPartnershipsView.as_view(), name='team-partnerships'),

    # Mentorship
    path('projects/<int:team_id>/assign-mentor/', AssignMentorView.as_view(), name='assign-mentor'),
    path('teams/<int:team_id>/mentors/', TeamMentorsView.as_view(), name='team-mentors'),
    path('mentors/<int:mentor_id>/reviews/', AddMentorReviewView.as_view(), name='add-mentor-review'),

    # Document sharing
    path('teams/<int:team_id>/documents/', ProjectDocumentListCreateView.as_view(), name='team-documents'),

    # Progress & impact monitoring (read-only for industry)
    path('teams/<int:team_id>/milestones/', TeamMilestonesForIndustryView.as_view(), name='industry-team-milestones'),

    # Recognition / participation summary
    path('my-impact-summary/', MyImpactSummaryView.as_view(), name='my-impact-summary'),

    # Admin: registration & verification
    path('admin/create/', AdminCreateIndustryView.as_view(), name='admin-create-industry'),
    path('admin/list/', AdminIndustryListView.as_view(), name='admin-list-industry'),
    path('admin/<int:partner_id>/set-status/', AdminSetIndustryStatusView.as_view(), name='admin-set-industry-status'),
]
