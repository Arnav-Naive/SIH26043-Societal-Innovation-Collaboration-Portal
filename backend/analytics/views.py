from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, F

from accounts.permissions import IsGovAdmin
from challenges.models import Challenge
from universities.models import ProjectTeam
from industry.models import Partnership


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = Challenge.objects.count()
        under_review = Challenge.objects.filter(status='UNDER_REVIEW').count()
        in_progress = Challenge.objects.filter(status='IN_PROGRESS').count()
        completed = Challenge.objects.filter(status='COMPLETED').count()
        routed = Challenge.objects.filter(status='ROUTED').count()
        submitted = Challenge.objects.filter(status='SUBMITTED').count()
        teams_formed = ProjectTeam.objects.count()
        active_partnerships = Partnership.objects.filter(status='ACTIVE').count()
        pending_partnerships = Partnership.objects.filter(status='PENDING').count()

        return Response({
            'total_challenges': total,
            'submitted': submitted,
            'under_review': under_review,
            'routed': routed,
            'in_progress': in_progress,
            'completed': completed,
            'teams_formed': teams_formed,
            'active_partnerships': active_partnerships,
            'pending_partnerships': pending_partnerships,
        })


class CategoryDistributionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            Challenge.objects
            .values('category__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        return Response([
            {'category': item['category__name'] or 'Uncategorized', 'count': item['count']}
            for item in data
        ])


class DistrictDistributionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            Challenge.objects
            .values('district__name')
            .annotate(
                total=Count('id'),
                in_progress=Count('id', filter=Q(status='IN_PROGRESS')),
                completed=Count('id', filter=Q(status='COMPLETED')),
            )
            .order_by('-total')
        )
        return Response([
            {
                'district': item['district__name'] or 'Unknown',
                'total': item['total'],
                'in_progress': item['in_progress'],
                'completed': item['completed']
            }
            for item in data
        ])


class StatusDistributionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            Challenge.objects
            .values('status')
            .annotate(count=Count('id'))
        )
        return Response(list(data))


class PipelineAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        submitted = Challenge.objects.count()
        validated = Challenge.objects.exclude(status='SUBMITTED').count()
        routed = Challenge.objects.filter(status__in=['ROUTED', 'IN_PROGRESS', 'COMPLETED']).count()
        team_formed = ProjectTeam.objects.count()
        projects = ProjectTeam.objects.exclude(stage='FORMED').count()
        pilots = ProjectTeam.objects.filter(stage__in=['PILOT', 'IMPLEMENTATION', 'IMPACT']).count()
        implemented = ProjectTeam.objects.filter(stage__in=['IMPLEMENTATION', 'IMPACT']).count()
        
        return Response([
            {'stage': 'Submitted', 'value': submitted},
            {'stage': 'Validated', 'value': validated},
            {'stage': 'Routed', 'value': routed},
            {'stage': 'Team Formed', 'value': team_formed},
            {'stage': 'Projects', 'value': projects},
            {'stage': 'Pilots', 'value': pilots},
            {'stage': 'Implemented', 'value': implemented},
        ])

from accounts.models import User
from universities.models import University
from industry.models import IndustryPartner

class AdminUserListView(APIView):
    permission_classes = [IsGovAdmin]
    def get(self, request):
        users = User.objects.all().values('id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
        return Response(list(users))

class AdminUniversityListView(APIView):
    permission_classes = [IsGovAdmin]
    def get(self, request):
        unis = University.objects.all().values('id', 'name', 'state', 'contact_email', 'is_active', 'created_at', district_name=F('district__name'))
        return Response(list(unis))

class AdminIndustryListView(APIView):
    permission_classes = [IsGovAdmin]
    def get(self, request):
        inds = IndustryPartner.objects.all().values('id', 'company_name', 'sector', 'contact_email', 'is_active', 'created_at', username=F('user__username'))
        return Response(list(inds))
