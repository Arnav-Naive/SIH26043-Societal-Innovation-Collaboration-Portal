from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DistrictViewSet, CategoryViewSet, ExpertiseAreaViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'districts', DistrictViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'expertise-areas', ExpertiseAreaViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
