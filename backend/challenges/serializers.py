from rest_framework import serializers
from .models import Challenge, ChallengeMedia, ChallengeStatusHistory
from accounts.serializers import UserSerializer


class ChallengeMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ChallengeMedia
        fields = ('id', 'file', 'file_url', 'media_type', 'uploaded_at')
        read_only_fields = ('id', 'file_url', 'uploaded_at')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class ChallengeStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ChallengeStatusHistory
        fields = ('id', 'status', 'changed_by_name', 'note', 'timestamp')

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_full_name() or obj.changed_by.username
        return 'System'


class ChallengeListSerializer(serializers.ModelSerializer):
    citizen_name = serializers.SerializerMethodField()
    assigned_university_name = serializers.SerializerMethodField()
    media_count = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = (
            'id', 'reference_id', 'title', 'district', 'category',
            'category_confidence', 'priority', 'status',
            'citizen_name', 'assigned_university_name', 'media_count',
            'created_at', 'updated_at',
        )

    def get_citizen_name(self, obj):
        return obj.citizen.get_full_name() or obj.citizen.username

    def get_assigned_university_name(self, obj):
        return obj.assigned_university.name if obj.assigned_university else None

    def get_media_count(self, obj):
        return obj.media.count()


class ChallengeDetailSerializer(serializers.ModelSerializer):
    citizen = UserSerializer(read_only=True)
    media = ChallengeMediaSerializer(many=True, read_only=True)
    status_history = ChallengeStatusHistorySerializer(many=True, read_only=True)
    assigned_university_name = serializers.SerializerMethodField()
    assigned_university_id = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = (
            'id', 'reference_id', 'title', 'description', 'district', 'location',
            'category', 'category_confidence', 'category_reason',
            'priority', 'status', 'routing_note',
            'citizen', 'assigned_university_id', 'assigned_university_name',
            'media', 'status_history',
            'created_at', 'updated_at',
        )

    def get_assigned_university_name(self, obj):
        return obj.assigned_university.name if obj.assigned_university else None

    def get_assigned_university_id(self, obj):
        return obj.assigned_university.id if obj.assigned_university else None


class ChallengeSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = ('title', 'description', 'district', 'location')
