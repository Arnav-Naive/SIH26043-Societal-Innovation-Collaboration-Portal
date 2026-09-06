from django.urls import path
from .views import (
    AnalyticsSummaryView, 
    CategoryDistributionView, 
    DistrictDistributionView, 
    StatusDistributionView,
    PipelineAnalyticsView,
    AdminUserListView,
    AdminUniversityListView,
    AdminIndustryListView
)

urlpatterns = [
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('categories/', CategoryDistributionView.as_view(), name='analytics-categories'),
    path('districts/', DistrictDistributionView.as_view(), name='analytics-districts'),
    path('status/', StatusDistributionView.as_view(), name='analytics-status'),
    path('pipeline/', PipelineAnalyticsView.as_view(), name='analytics-pipeline'),
    path('users/', AdminUserListView.as_view(), name='admin-users'),
    path('universities/', AdminUniversityListView.as_view(), name='admin-universities'),
    path('industry/', AdminIndustryListView.as_view(), name='admin-industry'),
]
