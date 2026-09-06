from rest_framework import serializers
from .models import IndustryPartner, Partnership


class IndustryPartnerSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = IndustryPartner
        fields = ('id', 'company_name', 'sector', 'description', 'website', 'contact_email', 'user_name')

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class PartnershipSerializer(serializers.ModelSerializer):
    industry_partner = IndustryPartnerSerializer(read_only=True)
    project_team_id = serializers.IntegerField(source='project_team.id', read_only=True)
    challenge_title = serializers.SerializerMethodField()
    university_name = serializers.SerializerMethodField()

    class Meta:
        model = Partnership
        fields = (
            'id', 'project_team_id', 'challenge_title', 'university_name',
            'industry_partner', 'support_type', 'contribution_details',
            'status', 'created_at',
        )
        read_only_fields = ('id', 'status', 'created_at')

    def get_challenge_title(self, obj):
        return obj.project_team.challenge.title

    def get_university_name(self, obj):
        return obj.project_team.university.name


class OfferSupportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partnership
        fields = ('support_type', 'contribution_details')
