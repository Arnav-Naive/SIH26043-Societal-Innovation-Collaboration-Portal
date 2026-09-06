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
            'id', 'name', 'district', 'state', 'expertise_areas',
            'contact_email', 'contact_phone', 'website',
            'spoc_name', 'assigned_challenges_count',
        )

    def get_spoc_name(self, obj):
        return obj.spoc.get_full_name() or obj.spoc.username if obj.spoc else None

    def get_assigned_challenges_count(self, obj):
        return obj.assigned_challenges.count()


class UniversityMatchSerializer(serializers.ModelSerializer):
    """Includes relevance score for routing recommendations."""
    relevance_score = serializers.SerializerMethodField()
    match_reason = serializers.SerializerMethodField()

    class Meta:
        model = University
        fields = ('id', 'name', 'district', 'expertise_areas', 'relevance_score', 'match_reason')

    def get_relevance_score(self, obj):
        category = self.context.get('category', '')
        if category in obj.expertise_areas:
            return 95
        return 40

    def get_match_reason(self, obj):
        category = self.context.get('category', '')
        if category in obj.expertise_areas:
            return f'Strong match — {category} listed in expertise areas.'
        return 'Partial match — general research capacity.'


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
    milestone_count = serializers.IntegerField(read_only=True)
    approved_milestones = serializers.IntegerField(read_only=True)
    partnerships_count = serializers.SerializerMethodField()

    class Meta:
        model = ProjectTeam
        fields = (
            'id', 'challenge', 'challenge_id', 'university', 'faculty_mentor', 'faculty_mentor_id',
            'students', 'project_description', 'stage',
            'milestone_count', 'approved_milestones', 'partnerships_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'university', 'created_at', 'updated_at')

    def get_partnerships_count(self, obj):
        return obj.partnerships.count()
