from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsIndustryPartner
from universities.models import ProjectTeam
from universities.serializers import ProjectTeamSerializer
from .models import IndustryPartner, Partnership
from .serializers import PartnershipSerializer, OfferSupportSerializer


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
        support_type = self.request.query_params.get('support_type', '')

        if district:
            qs = qs.filter(challenge__district__icontains=district)
        if sector:
            qs = qs.filter(challenge__category__icontains=sector)
        return qs


class OfferSupportView(APIView):
    """Industry partner offers support to a project team."""
    permission_classes = [IsIndustryPartner]

    def post(self, request, team_id):
        try:
            team = ProjectTeam.objects.get(pk=team_id)
        except ProjectTeam.DoesNotExist:
            return Response({'detail': 'Project team not found.'}, status=404)

        # Get or create industry partner profile
        try:
            partner = request.user.industry_profile
        except IndustryPartner.DoesNotExist:
            return Response({'detail': 'Industry profile not set up. Contact admin.'}, status=403)

        serializer = OfferSupportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        partnership = Partnership.objects.create(
            project_team=team,
            industry_partner=partner,
            support_type=serializer.validated_data['support_type'],
            contribution_details=serializer.validated_data['contribution_details'],
            status=Partnership.STATUS_PENDING,
        )

        return Response(
            PartnershipSerializer(partnership, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


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
    """View partnerships for a specific team."""
    permission_classes = [IsAuthenticated]
    serializer_class = PartnershipSerializer

    def get_queryset(self):
        team_id = self.kwargs.get('team_id')
        return Partnership.objects.filter(project_team_id=team_id).order_by('-created_at')
