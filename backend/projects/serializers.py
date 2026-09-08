from rest_framework import serializers
from .models import Milestone, MilestoneEvidence, ProjectImpact


class MilestoneEvidenceSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MilestoneEvidence
        fields = ('id', 'file', 'file_url', 'description', 'uploaded_at')
        read_only_fields = ('id', 'file_url', 'uploaded_at')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class MilestoneSerializer(serializers.ModelSerializer):
    evidence = MilestoneEvidenceSerializer(many=True, read_only=True)
    project_team_id = serializers.IntegerField(source='project_team.id', read_only=True)

    class Meta:
        model = Milestone
        fields = (
            'id', 'project_team_id', 'title', 'description', 'due_date',
            'status', 'review_note', 'evidence',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'status', 'review_note', 'created_at', 'updated_at')


class MilestoneCreateSerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Milestone
        fields = ('title', 'description', 'due_date')


class ProjectImpactSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()
    project_team_id = serializers.IntegerField(source='project_team.id', read_only=True)
    outcome_evidence_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectImpact
        fields = (
            'id', 'project_team_id', 'beneficiaries_count', 'cost_incurred',
            'adoption_rate', 'before_metrics', 'after_metrics',
            'outcome_evidence', 'outcome_evidence_url',
            'recorded_by_name', 'recorded_at'
        )
        read_only_fields = ('id', 'recorded_by_name', 'recorded_at', 'outcome_evidence_url')

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name() or obj.recorded_by.username
        return None

    def get_outcome_evidence_url(self, obj):
        request = self.context.get('request')
        if obj.outcome_evidence and request:
            return request.build_absolute_uri(obj.outcome_evidence.url)
        return None
