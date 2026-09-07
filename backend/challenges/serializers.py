from rest_framework import serializers
from .models import Challenge, ChallengeMedia, ChallengeStatusHistory, DuplicateFlag
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
    district = serializers.StringRelatedField()
    category = serializers.StringRelatedField()
    classification_source = serializers.CharField(read_only=True)
    priority_score = serializers.FloatField(read_only=True)

    class Meta:
        model = Challenge
        fields = (
            'id', 'reference_id', 'title', 'district', 'category',
            'category_confidence', 'priority', 'priority_score',
            'classification_source', 'status',
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
    district = serializers.StringRelatedField()
    category = serializers.StringRelatedField()
    manual_category_name = serializers.SerializerMethodField()

    # Nested AI classification block
    ai_classification = serializers.SerializerMethodField()
    # Nested priority detail block
    priority_detail = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = (
            'id', 'reference_id', 'title', 'description', 'district', 'location',
            'category', 'category_confidence', 'category_reason',
            'priority', 'status', 'routing_note',
            'original_language', 'normalized_description', 'normalization_note',
            'citizen', 'assigned_university_id', 'assigned_university_name',
            'media', 'status_history',
            # AI fields
            'ai_category_name', 'ai_confidence', 'ai_classification_reason',
            'classification_source', 'ai_processed_at',
            'manual_category_name',
            'ai_classification',
            # Priority fields
            'priority_score', 'priority_breakdown', 'priority_reason',
            'severity', 'frequency', 'affected_population', 'urgency',
            'manual_priority',
            'priority_detail',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'original_language', 'normalized_description', 'normalization_note',
            'ai_category_name', 'ai_confidence', 'ai_classification_reason',
            'classification_source', 'ai_processed_at',
            'priority_score', 'priority_breakdown', 'priority_reason',
        )

    def get_assigned_university_name(self, obj):
        return obj.assigned_university.name if obj.assigned_university else None

    def get_assigned_university_id(self, obj):
        return obj.assigned_university.id if obj.assigned_university else None

    def get_manual_category_name(self, obj):
        return obj.manual_category.name if obj.manual_category else None

    def get_ai_classification(self, obj):
        """Structured AI classification block for frontend."""
        accepted_by_name = None
        if obj.ai_accepted_by:
            accepted_by_name = obj.ai_accepted_by.get_full_name() or obj.ai_accepted_by.username

        return {
            "ai_category": obj.ai_category_name or None,
            "confidence": round(obj.ai_confidence * 100, 0) if obj.ai_confidence else 0,
            "reason": obj.ai_classification_reason or '',
            "visual_evidence": obj.ai_visual_evidence,
            "source": obj.classification_source or 'keyword',
            "processed_at": obj.ai_processed_at,
            # Review state — persisted in DB, survives refresh
            "review_status": obj.ai_review_status,   # 'pending' | 'accepted' | 'overridden'
            "accepted_by": accepted_by_name,
            "accepted_at": obj.ai_accepted_at,
            # Override details
            "override_applied": obj.ai_override_applied,
            "manual_category": self.get_manual_category_name(obj),
            "manual_priority": obj.manual_priority or None,
            # Final effective values
            "final_category": (obj.manual_category.name if obj.manual_category else obj.ai_category_name) or None,
        }

    def get_priority_detail(self, obj):
        """Structured priority block for frontend."""
        breakdown = obj.priority_breakdown or {}
        return {
            "score": obj.priority_score,
            "level": obj.effective_priority,
            "reason": obj.priority_reason or '',
            "breakdown": {
                "severity": breakdown.get('severity', 0),
                "frequency": breakdown.get('frequency', 0),
                "validation": breakdown.get('validation_score', 0),
                "affected_population": breakdown.get('affected_population', 0),
                "urgency": breakdown.get('urgency', 0),
            },
        }


class ChallengeSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = ('title', 'description', 'district', 'location')


class AIOverrideSerializer(serializers.Serializer):
    """Validates admin override input."""
    category_name = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.ChoiceField(
        choices=['LOW', 'MEDIUM', 'HIGH', ''],
        required=False, allow_blank=True
    )
    override_reason = serializers.CharField(required=False, allow_blank=True)


class DuplicateFlagSerializer(serializers.ModelSerializer):
    """
    Serializes DuplicateFlag with nested challenge details
    so the admin can compare side-by-side without extra API calls.
    """
    challenge_a = ChallengeListSerializer(read_only=True)
    challenge_b = ChallengeListSerializer(read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DuplicateFlag
        fields = (
            'id', 'challenge_a', 'challenge_b', 'similarity_score',
            'status', 'reviewed_by_name', 'reviewed_at', 'created_at',
        )

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return None
