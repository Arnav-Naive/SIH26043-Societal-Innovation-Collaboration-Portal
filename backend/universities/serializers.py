from rest_framework import serializers
from .models import University, ProjectTeam
from accounts.serializers import UserSerializer
from challenges.serializers import ChallengeListSerializer


class UniversitySerializer(serializers.ModelSerializer):
    spoc_name = serializers.SerializerMethodField()
    assigned_challenges_count = serializers.SerializerMethodField()

    class Meta:
        model = University
        fields = (
            'id', 'name', 'institution_type', 'registration_id', 'address', 'district', 'state', 'expertise_areas',
            'contact_email', 'contact_phone', 'website',
            'spoc_name', 'assigned_challenges_count', 'status', 'departments', 'facilities'
        )

    def get_spoc_name(self, obj):
        return obj.spoc.get_full_name() or obj.spoc.username if obj.spoc else None

    def get_assigned_challenges_count(self, obj):
        return obj.assigned_challenges.count()

class AdminHEIApprovalSerializer(serializers.ModelSerializer):
    spoc_name = serializers.SerializerMethodField()
    district_name = serializers.CharField(source='district.name', read_only=True)
    spoc_email = serializers.CharField(source='spoc.email', read_only=True)
    spoc_phone = serializers.CharField(source='spoc.phone', read_only=True)

    class Meta:
        model = University
        fields = (
            'id', 'name', 'institution_type', 'registration_id', 'address', 'district_name', 'state',
            'contact_email', 'contact_phone', 'website', 'departments', 'facilities',
            'spoc_name', 'spoc_email', 'spoc_phone', 'designation', 'status', 'verification_document',
            'created_at'
        )

    def get_spoc_name(self, obj):
        return obj.spoc.get_full_name() or obj.spoc.username if obj.spoc else None


class UniversityMatchSerializer(serializers.ModelSerializer):
    """Includes relevance score for routing recommendations.

    Expects context={'scores': {university_id: {'score': int, 'reason': str}}}
    as produced by universities.matching.compute_university_matches().
    Falls back to a flat baseline if no score is present for a given
    university (keeps this serializer safe to use without the matching
    engine too).
    """
    relevance_score = serializers.SerializerMethodField()
    match_reason = serializers.SerializerMethodField()

    class Meta:
        model = University
        fields = ('id', 'name', 'district', 'expertise_areas', 'relevance_score', 'match_reason')

    def _match_info(self, obj):
        scores = self.context.get('scores') or {}
        return scores.get(obj.id, {'score': 40, 'reason': 'Baseline — general research capacity.'})

    def get_relevance_score(self, obj):
        return self._match_info(obj)['score']

    def get_match_reason(self, obj):
        return self._match_info(obj)['reason']


class ProjectTeamSerializer(serializers.ModelSerializer):
    challenge = ChallengeListSerializer(read_only=True)
    university = UniversitySerializer(read_only=True)
    faculty_mentor = UserSerializer(read_only=True)
    challenge_id = serializers.PrimaryKeyRelatedField(
        queryset=__import__('challenges.models', fromlist=['Challenge']).Challenge.objects.all(),
        source='challenge', write_only=True
    )
    faculty_mentor_id = serializers.PrimaryKeyRelatedField(
        queryset=__import__('accounts.models', fromlist=['User']).User.objects.filter(role='faculty_mentor'),
        source='faculty_mentor', write_only=True, required=False, allow_null=True
    )
    milestones = __import__('projects.serializers', fromlist=['MilestoneSerializer']).MilestoneSerializer(many=True, read_only=True)
    milestone_count = serializers.SerializerMethodField()
    approved_milestones = serializers.SerializerMethodField()
    partnerships_count = serializers.SerializerMethodField()

    class Meta:
        model = ProjectTeam
        fields = (
            'id', 'challenge', 'challenge_id', 'university', 'faculty_mentor', 'faculty_mentor_id',
            'students', 'project_title', 'objective', 'domain', 'project_description',
            'stage', 'milestones', 'milestone_count', 'approved_milestones', 'partnerships_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'university', 'created_at', 'updated_at')

    def get_partnerships_count(self, obj):
        return obj.partnerships.count()

    def get_milestone_count(self, obj):
        return obj.milestones.count()

    def get_approved_milestones(self, obj):
        return obj.milestones.filter(status='APPROVED').count()
