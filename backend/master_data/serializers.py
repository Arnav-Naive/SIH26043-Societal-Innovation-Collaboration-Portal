from rest_framework import serializers
from .models import District, Category, ExpertiseArea, AuditLog

class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ExpertiseAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpertiseArea
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'
