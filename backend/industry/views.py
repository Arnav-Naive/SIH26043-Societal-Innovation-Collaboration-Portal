"""FILE PATH: backend/industry/views.py  (REPLACE EXISTING FILE)"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsIndustryPartner, IsGovAdmin
from accounts.notifications import notify
from universities.models import ProjectTeam
from universities.serializers import ProjectTeamSerializer
from .models import IndustryPartner, Partnership, IndustryMentor, MentorReview, ProjectDocument
from .serializers import (
    PartnershipSerializer, OfferSupportSerializer, PartnershipRespondSerializer,
    IndustryPartnerSerializer, AdminCreateIndustrySerializer,
    IndustryMentorSerializer, MentorReviewSerializer, ProjectDocumentSerializer,
)


def _team_stakeholders(team):
    """Returns (hei_spoc_user, faculty_mentor_user) for a project team, for notifications."""
    spoc = team.university.spoc if team.university else None
    mentor = team.faculty_mentor
    return spoc, mentor


class BrowseProjectsView(generics.ListAPIView):
    """Industry can browse all active project teams."""
    permission_classes = [IsIndustryPartner]
    serializer_class = ProjectTeamSerializer

    def get_queryset(self):
        qs = ProjectTeam.objects.select_related(
            'challenge', 'university', 'faculty_mentor'
        ).exclude(challenge__status='COMPLETED').order_by('-created_at')

        sector = self.request.query_params.get('sector', '')
        district = self.request.query_params.get('district', '')

        if district:
            qs = qs.filter(challenge__district__name__icontains=district)
        if sector:
            qs = qs.filter(challenge__category__name__icontains=sector)
        return qs


class OfferSupportView(APIView):
    """Industry partner offers support (mentorship / funding / pilot /
    infrastructure) to a project team. Requires an APPROVED, active
    industry profile."""
    permission_classes = [IsIndustryPartner]

    def post(self, request, team_id):
        try:
            team = ProjectTeam.objects.select_related('university', 'challenge').get(pk=team_id)
        except ProjectTeam.DoesNotExist:
            return Response({'detail': 'Project team not found.'}, status=404)

        try:
            partner = request.user.industry_profile
        except IndustryPartner.DoesNotExist:
            return Response({'detail': 'Industry profile not set up. Contact admin.'}, status=403)

        if partner.status != IndustryPartner.STATUS_APPROVED or not partner.is_active:
            return Response({'detail': 'Your industry account is not yet verified/active.'}, status=403)

        serializer = OfferSupportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        partnership = Partnership.objects.create(
            project_team=team,
            industry_partner=partner,
            support_type=serializer.validated_data['support_type'],
            contribution_details=serializer.validated_data['contribution_details'],
            amount=serializer.validated_data.get('amount'),
            funding_status=serializer.validated_data.get('funding_status'),
            funding_notes=serializer.validated_data.get('funding_notes', ''),
            status=Partnership.STATUS_PENDING,
        )

        spoc, mentor = _team_stakeholders(team)
        notify(
            spoc,
            title='New industry support offer',
            message=f'{partner.company_name} offered {partnership.get_support_type_display()} support for "{team.challenge.title}".',
            link=f'/hei/teams/{team.id}',
        )

        return Response(
            PartnershipSerializer(partnership, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class PartnershipRespondView(APIView):
    """HEI SPOC (or gov admin) accepts or rejects an offered partnership,
    moving it from PENDING to ACTIVE or REJECTED."""
    permission_classes = [IsAuthenticated]

    def post(self, request, partnership_id):
        try:
            partnership = Partnership.objects.select_related(
                'project_team__university', 'industry_partner__user'
            ).get(pk=partnership_id)
        except Partnership.DoesNotExist:
            return Response({'detail': 'Partnership not found.'}, status=404)

        user = request.user
        is_spoc = (
            user.role == 'hei_spoc' and
            partnership.project_team.university.spoc_id == user.id
        )
        if not (is_spoc or user.role == 'gov_admin'):
            return Response({'detail': 'You do not have permission to respond to this offer.'}, status=403)

        if partnership.status != Partnership.STATUS_PENDING:
            return Response({'detail': 'This partnership has already been responded to.'}, status=400)

        serializer = PartnershipRespondSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        action = serializer.validated_data['action']
        partnership.status = Partnership.STATUS_ACTIVE if action == 'accept' else Partnership.STATUS_REJECTED
        partnership.responded_by = user
        partnership.response_note = serializer.validated_data.get('note', '')
        partnership.save()

        notify(
            partnership.industry_partner.user,
            title=f'Your partnership offer was {partnership.status.lower()}',
            message=f'Your {partnership.get_support_type_display()} offer for "{partnership.project_team.challenge.title}" was {partnership.status.lower()}.',
            link='/industry/my-partnerships',
        )

        return Response(PartnershipSerializer(partnership, context={'request': request}).data)


class MyPartnershipsView(generics.ListAPIView):
    """Industry partner views their own partnerships."""
    permission_classes = [IsIndustryPartner]
    serializer_class = PartnershipSerializer

    def get_queryset(self):
        try:
            partner = self.request.user.industry_profile
            return Partnership.objects.filter(industry_partner=partner).order_by('-created_at')
        except IndustryPartner.DoesNotExist:
            return Partnership.objects.none()


class TeamPartnershipsView(generics.ListAPIView):
    """View partnerships for a specific team (visible to industry,
    HEI SPOC/faculty of that team, and admin)."""
    permission_classes = [IsAuthenticated]
    serializer_class = PartnershipSerializer

    def get_queryset(self):
        team_id = self.kwargs.get('team_id')
        return Partnership.objects.filter(project_team_id=team_id).order_by('-created_at')


# ---------------------------------------------------------------------
# Technical Mentorship
# ---------------------------------------------------------------------

class AssignMentorView(APIView):
    """Industry partner assigns one of their own staff as a mentor to a
    project team they have an active partnership with."""
    permission_classes = [IsIndustryPartner]

    def post(self, request, team_id):
        try:
            team = ProjectTeam.objects.select_related('university', 'challenge').get(pk=team_id)
        except ProjectTeam.DoesNotExist:
            return Response({'detail': 'Project team not found.'}, status=404)

        try:
            partner = request.user.industry_profile
        except IndustryPartner.DoesNotExist:
            return Response({'detail': 'Industry profile not set up.'}, status=403)

        has_active_partnership = Partnership.objects.filter(
            project_team=team, industry_partner=partner, status=Partnership.STATUS_ACTIVE
        ).exists()
        if not has_active_partnership:
            return Response(
                {'detail': 'You need an active partnership with this team before assigning a mentor.'},
                status=403
            )

        mentor_name = request.data.get('mentor_name', '').strip()
        mentor_contact = request.data.get('mentor_contact', '').strip()
        expertise_area = request.data.get('expertise_area', '').strip()

        if not mentor_name or not mentor_contact:
            return Response({'detail': 'mentor_name and mentor_contact are required.'}, status=400)

        mentor = IndustryMentor.objects.create(
            project_team=team,
            industry_partner=partner,
            mentor_name=mentor_name,
            mentor_contact=mentor_contact,
            expertise_area=expertise_area,
        )

        spoc, faculty_mentor = _team_stakeholders(team)
        for recipient in (spoc, faculty_mentor):
            notify(
                recipient,
                title='Industry mentor assigned',
                message=f'{partner.company_name} assigned {mentor_name} as a technical mentor for "{team.challenge.title}".',
                link=f'/hei/teams/{team.id}',
            )

        return Response(IndustryMentorSerializer(mentor).data, status=status.HTTP_201_CREATED)


class TeamMentorsView(generics.ListAPIView):
    """List mentors assigned to a project team (visible to industry, HEI, admin)."""
    permission_classes = [IsAuthenticated]
    serializer_class = IndustryMentorSerializer

    def get_queryset(self):
        team_id = self.kwargs.get('team_id')
        return IndustryMentor.objects.filter(project_team_id=team_id, is_active=True).prefetch_related('reviews')


class AddMentorReviewView(APIView):
    """Mentor's industry partner logs a technical review/consultation note."""
    permission_classes = [IsIndustryPartner]

    def post(self, request, mentor_id):
        try:
            mentor = IndustryMentor.objects.select_related('project_team', 'industry_partner').get(pk=mentor_id)
        except IndustryMentor.DoesNotExist:
            return Response({'detail': 'Mentor assignment not found.'}, status=404)

        if mentor.industry_partner.user_id != request.user.id:
            return Response({'detail': 'You can only add reviews for your own assigned mentors.'}, status=403)

        note = request.data.get('note', '').strip()
        if not note:
            return Response({'detail': 'note is required.'}, status=400)

        review = MentorReview.objects.create(mentor=mentor, note=note)
        return Response(MentorReviewSerializer(review).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------
# Project Collaboration — document sharing
# ---------------------------------------------------------------------

class ProjectDocumentListCreateView(APIView):
    """List or upload shared documents for a project team.
    Accessible to: the team's HEI SPOC/faculty mentor, any industry
    partner with a partnership on that team, and gov admin."""
    permission_classes = [IsAuthenticated]

    def _can_access(self, request, team):
        user = request.user
        if user.role == 'gov_admin':
            return True
        if user.role == 'hei_spoc' and team.university.spoc_id == user.id:
            return True
        if user.role == 'faculty_mentor' and team.faculty_mentor_id == user.id:
            return True
        if user.role == 'industry_partner':
            try:
                partner = user.industry_profile
                return Partnership.objects.filter(project_team=team, industry_partner=partner).exists()
            except IndustryPartner.DoesNotExist:
                return False
        return False

    def get(self, request, team_id):
        try:
            team = ProjectTeam.objects.select_related('university').get(pk=team_id)
        except ProjectTeam.DoesNotExist:
            return Response({'detail': 'Project team not found.'}, status=404)

        if not self._can_access(request, team):
            return Response({'detail': 'You do not have access to this team\'s documents.'}, status=403)

        docs = ProjectDocument.objects.filter(project_team=team)
        return Response(ProjectDocumentSerializer(docs, many=True, context={'request': request}).data)

    def post(self, request, team_id):
        try:
            team = ProjectTeam.objects.select_related('university').get(pk=team_id)
        except ProjectTeam.DoesNotExist:
            return Response({'detail': 'Project team not found.'}, status=404)

        if not self._can_access(request, team):
            return Response({'detail': 'You do not have access to this team\'s documents.'}, status=403)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'file is required.'}, status=400)

        doc = ProjectDocument.objects.create(
            project_team=team,
            uploaded_by=request.user,
            file=file_obj,
            description=request.data.get('description', ''),
        )

        spoc, faculty_mentor = _team_stakeholders(team)
        uploader_name = request.user.get_full_name() or request.user.username
        for recipient in (spoc, faculty_mentor):
            if recipient and recipient.id != request.user.id:
                notify(
                    recipient,
                    title='New document shared',
                    message=f'{uploader_name} shared a document for "{team.challenge.title}".',
                    link=f'/hei/teams/{team.id}',
                )

        return Response(
            ProjectDocumentSerializer(doc, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


# ---------------------------------------------------------------------
# Progress & Impact Monitoring (read access into existing Milestone /
# ProjectImpact models from the projects app — industry gets read-only
# visibility into teams they partner with).
# ---------------------------------------------------------------------

class TeamMilestonesForIndustryView(generics.ListAPIView):
    """Read-only milestone visibility for industry partners with an
    active partnership on the team."""
    permission_classes = [IsIndustryPartner]

    def get_serializer_class(self):
        from projects.serializers import MilestoneSerializer
        return MilestoneSerializer

    def get_queryset(self):
        from projects.models import Milestone
        team_id = self.kwargs.get('team_id')
        try:
            partner = self.request.user.industry_profile
        except IndustryPartner.DoesNotExist:
            return Milestone.objects.none()

        has_partnership = Partnership.objects.filter(
            project_team_id=team_id, industry_partner=partner
        ).exists()
        if not has_partnership:
            return Milestone.objects.none()

        return Milestone.objects.filter(project_team_id=team_id)


# ---------------------------------------------------------------------
# Industry Recognition — participation/contribution summary
# ---------------------------------------------------------------------

class MyImpactSummaryView(APIView):
    """Aggregated participation record for the logged-in industry partner:
    partnerships, funding committed/disbursed, and completed projects
    with recorded impact — their 'contribution history'."""
    permission_classes = [IsIndustryPartner]

    def get(self, request):
        try:
            partner = request.user.industry_profile
        except IndustryPartner.DoesNotExist:
            return Response({'detail': 'Industry profile not set up.'}, status=403)

        partnerships = Partnership.objects.filter(industry_partner=partner)
        active_or_completed = partnerships.filter(status__in=[Partnership.STATUS_ACTIVE, Partnership.STATUS_COMPLETED])

        total_committed = sum(
            (p.amount or 0) for p in partnerships.filter(funding_status=Partnership.FUNDING_COMMITTED)
        )
        total_disbursed = sum(
            (p.amount or 0) for p in partnerships.filter(funding_status=Partnership.FUNDING_DISBURSED)
        )

        completed_projects = []
        from projects.models import ProjectImpact
        for p in active_or_completed.select_related('project_team__challenge'):
            impact = ProjectImpact.objects.filter(project_team=p.project_team).first()
            if impact:
                completed_projects.append({
                    'challenge_title': p.project_team.challenge.title,
                    'support_type': p.get_support_type_display(),
                    'beneficiaries_count': impact.beneficiaries_count,
                    'adoption_rate': impact.adoption_rate,
                })

        return Response({
            'company_name': partner.company_name,
            'total_partnerships': partnerships.count(),
            'active_or_completed_partnerships': active_or_completed.count(),
            'total_funding_committed': total_committed,
            'total_funding_disbursed': total_disbursed,
            'mentors_assigned': IndustryMentor.objects.filter(industry_partner=partner).count(),
            'projects_with_recorded_impact': completed_projects,
        })


# ---------------------------------------------------------------------
# Admin: Industry Registration & Verification
# ---------------------------------------------------------------------

class AdminCreateIndustryView(APIView):
    """Gov admin creates a new industry account + profile in one step
    (self-registration is disabled for this role)."""
    permission_classes = [IsGovAdmin]

    def post(self, request):
        from accounts.models import User

        serializer = AdminCreateIndustrySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        data = serializer.validated_data

        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role=User.ROLE_INDUSTRY,
        )

        partner = IndustryPartner.objects.create(
            user=user,
            company_name=data['company_name'],
            org_type=data['org_type'],
            registration_number=data.get('registration_number', ''),
            sector=data['sector'],
            description=data.get('description', ''),
            website=data.get('website', ''),
            contact_email=data.get('contact_email', ''),
            status=IndustryPartner.STATUS_APPROVED,
            verified_by=request.user,
            is_active=True,
        )
        import django.utils.timezone as tz
        partner.verified_at = tz.now()
        partner.save()

        notify(
            user,
            title='Your industry account is ready',
            message='Your industry partner account has been created and verified. You can now browse and support projects.',
            link='/industry/projects',
        )

        return Response(IndustryPartnerSerializer(partner).data, status=status.HTTP_201_CREATED)


class AdminIndustryListView(generics.ListAPIView):
    """Gov admin views all industry partner accounts for management."""
    permission_classes = [IsGovAdmin]
    serializer_class = IndustryPartnerSerializer
    queryset = IndustryPartner.objects.select_related('user').order_by('-created_at')


class AdminSetIndustryStatusView(APIView):
    """Gov admin approves, rejects, or deactivates/reactivates an
    existing industry account."""
    permission_classes = [IsGovAdmin]

    def post(self, request, partner_id):
        try:
            partner = IndustryPartner.objects.select_related('user').get(pk=partner_id)
        except IndustryPartner.DoesNotExist:
            return Response({'detail': 'Industry partner not found.'}, status=404)

        new_status = request.data.get('status')
        if new_status not in dict(IndustryPartner.STATUS_CHOICES):
            return Response({'detail': 'Invalid status.'}, status=400)

        partner.status = new_status
        partner.rejection_reason = request.data.get('rejection_reason', '') if new_status == IndustryPartner.STATUS_REJECTED else ''
        partner.is_active = (new_status == IndustryPartner.STATUS_APPROVED)
        partner.verified_by = request.user
        import django.utils.timezone as tz
        partner.verified_at = tz.now()
        partner.save()

        notify(
            partner.user,
            title=f'Your industry account status: {partner.get_status_display()}',
            message=partner.rejection_reason or f'Your industry account is now {partner.get_status_display()}.',
            link='/industry/projects',
        )

        return Response(IndustryPartnerSerializer(partner).data)
