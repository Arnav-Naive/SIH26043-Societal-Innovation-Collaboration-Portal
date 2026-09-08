from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import IsGovAdmin
from .models import District, Category, ExpertiseArea, AuditLog
from .serializers import DistrictSerializer, CategorySerializer, ExpertiseAreaSerializer, AuditLogSerializer

class ReadOnlyOrAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_gov_admin

class DistrictViewSet(viewsets.ModelViewSet):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

    @action(detail=True, methods=['post'], permission_classes=[IsGovAdmin])
    def toggle_active(self, request, pk=None):
        district = self.get_object()
        district.is_active = not district.is_active
        district.save()
        
        from .utils import log_audit
        log_audit(
            user=request.user,
            action='Toggled District Status',
            entity_type='District',
            entity_id=str(district.id),
            new_value=f"is_active={district.is_active}"
        )
        return Response({'status': 'success', 'is_active': district.is_active})

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrAdminPermission]

    @action(detail=True, methods=['post'], permission_classes=[IsGovAdmin])
    def toggle_active(self, request, pk=None):
        category = self.get_object()
        category.is_active = not category.is_active
        category.save()
        
        from .utils import log_audit
        log_audit(
            user=request.user,
            action='Toggled Category Status',
            entity_type='Category',
            entity_id=str(category.id),
            new_value=f"is_active={category.is_active}"
        )
        return Response({'status': 'success', 'is_active': category.is_active})

class ExpertiseAreaViewSet(viewsets.ModelViewSet):
    queryset = ExpertiseArea.objects.all()
    serializer_class = ExpertiseAreaSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

    @action(detail=True, methods=['post'], permission_classes=[IsGovAdmin])
    def toggle_active(self, request, pk=None):
        area = self.get_object()
        area.is_active = not area.is_active
        area.save()
        
        from .utils import log_audit
        log_audit(
            user=request.user,
            action='Toggled ExpertiseArea Status',
            entity_type='ExpertiseArea',
            entity_id=str(area.id),
            new_value=f"is_active={area.is_active}"
        )
        return Response({'status': 'success', 'is_active': area.is_active})

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsGovAdmin]

from rest_framework.views import APIView
from .models import AIConfiguration
from .serializers import AIConfigurationSerializer

class AIConfigurationView(APIView):
    permission_classes = [IsGovAdmin]

    def get(self, request):
        config = AIConfiguration.load()
        return Response(AIConfigurationSerializer(config).data)

    def put(self, request):
        config = AIConfiguration.load()
        serializer = AIConfigurationSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            from .utils import log_audit
            log_audit(
                user=request.user,
                action='Updated AI Configuration',
                entity_type='AIConfiguration',
                entity_id='1',
                new_value=str(serializer.data)
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
