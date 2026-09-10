"""FILE PATH: backend/industry/serializers.py  (REPLACE EXISTING FILE)"""
from rest_framework import serializers
from .models import IndustryPartner, Partnership, IndustryMentor, MentorReview, ProjectDocument


class IndustryPartnerSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = IndustryPartner
        fields = (
            'id', 'company_name', 'org_type', 'registration_number', 'sector',
            'description', 'website', 'contact_email', 'user_name',
            'status', 'rejection_reason', 'is_active', 'created_at',
        )
        read_only_fields = ('id', 'status', 'rejection_reason', 'created_at')

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class AdminCreateIndustrySerializer(serializers.Serializer):
    """Used by a gov_admin to create a new industry account + profile
    in one step, since self-registration is disabled for this role."""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    company_name = serializers.CharField(max_length=300)
    org_type = serializers.ChoiceField(choices=IndustryPartner.ORG_TYPE_CHOICES)
    registration_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    sector = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    contact_email = serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value):
        from accounts.models import User
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value


class MentorReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorReview
        fields = ('id', 'note', 'created_at')
        read_only_fields = ('id', 'created_at')


class IndustryMentorSerializer(serializers.ModelSerializer):
    reviews = MentorReviewSerializer(many=True, read_only=True)
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = IndustryMentor
        fields = (
            'id', 'project_team', 'mentor_name', 'mentor_contact',
            'expertise_area', 'is_active', 'assigned_at', 'reviews', 'company_name',
        )
        read_only_fields = ('id', 'assigned_at')

    def get_company_name(self, obj):
        return obj.industry_partner.company_name


class ProjectDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectDocument
        fields = ('id', 'project_team', 'file', 'file_url', 'description', 'uploaded_by_name', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_by_name', 'file_url', 'uploaded_at')

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


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
            'status', 'amount', 'funding_status', 'funding_notes',
            'response_note', 'created_at',
        )
        read_only_fields = ('id', 'status', 'response_note', 'created_at')

    def get_challenge_title(self, obj):
        return obj.project_team.challenge.title

    def get_university_name(self, obj):
        return obj.project_team.university.name


class OfferSupportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partnership
        fields = ('support_type', 'contribution_details', 'amount', 'funding_status', 'funding_notes')

    def validate(self, data):
        if data.get('support_type') == Partnership.SUPPORT_FUNDING and not data.get('amount'):
            raise serializers.ValidationError({'amount': 'Amount is required when support type is Funding.'})
        return data


class PartnershipRespondSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['accept', 'reject'])
    note = serializers.CharField(required=False, allow_blank=True)
