from rest_framework import serializers
from .models import Milestone, MilestoneEvidence


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
    class Meta:
        model = Milestone
        fields = ('title', 'description', 'due_date')
