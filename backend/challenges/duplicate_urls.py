from django.urls import path
from .views import DuplicateFlagListView, DuplicateFlagReviewView

urlpatterns = [
    path('', DuplicateFlagListView.as_view(), name='duplicate-flag-list'),
    path('<int:pk>/review/', DuplicateFlagReviewView.as_view(), name='duplicate-flag-review'),
]
