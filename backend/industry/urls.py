from django.urls import path
from .views import BrowseProjectsView, OfferSupportView, MyPartnershipsView, TeamPartnershipsView

urlpatterns = [
    path('projects/', BrowseProjectsView.as_view(), name='industry-projects'),
    path('projects/<int:team_id>/offer-support/', OfferSupportView.as_view(), name='offer-support'),
    path('my-partnerships/', MyPartnershipsView.as_view(), name='my-partnerships'),
    path('teams/<int:team_id>/partnerships/', TeamPartnershipsView.as_view(), name='team-partnerships'),
]
