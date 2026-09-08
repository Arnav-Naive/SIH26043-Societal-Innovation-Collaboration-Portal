from django.urls import path
from .views import (
    AnalyticsSummaryView, 
    CitizenAnalyticsSummaryView,
    CategoryDistributionView, 
    DistrictDistributionView, 
    StatusDistributionView,
    PipelineAnalyticsView,
    AdminUserListView, AdminUserDetailView,
    AdminUniversityListView, AdminUniversityDetailView,
    AdminIndustryListView, AdminIndustryDetailView,
    GlobalSearchView,
    ExportReportView
)

urlpatterns = [
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('summary/citizen/', CitizenAnalyticsSummaryView.as_view(), name='analytics-summary-citizen'),
    path('categories/', CategoryDistributionView.as_view(), name='analytics-categories'),
    path('districts/', DistrictDistributionView.as_view(), name='analytics-districts'),
    path('status/', StatusDistributionView.as_view(), name='analytics-status'),
    path('pipeline/', PipelineAnalyticsView.as_view(), name='analytics-pipeline'),
    path('users/', AdminUserListView.as_view(), name='admin-users'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('universities/', AdminUniversityListView.as_view(), name='admin-universities'),
    path('universities/<int:pk>/', AdminUniversityDetailView.as_view(), name='admin-university-detail'),
    path('industry/', AdminIndustryListView.as_view(), name='admin-industry'),
    path('industry/<int:pk>/', AdminIndustryDetailView.as_view(), name='admin-industry-detail'),
    path('search/', GlobalSearchView.as_view(), name='analytics-search'),
    path('export/', ExportReportView.as_view(), name='analytics-export'),
]
