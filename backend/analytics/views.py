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
        users = User.objects.all().values('id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined', 'phone', 'organization', 'district')
        return Response(list(users))

    def post(self, request):
        from accounts.serializers import RegisterSerializer
        data = request.data.copy()
        data['password2'] = data.get('password', '')
        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            from master_data.utils import log_audit
            log_audit(request.user, 'Created User', 'User', 'new', new_value=data.get('username'))
            return Response({'message': 'User created successfully'}, status=201)
        return Response(serializer.errors, status=400)

class AdminUserDetailView(APIView):
    permission_classes = [IsGovAdmin]

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        data = request.data
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'email' in data: user.email = data['email']
        if 'phone' in data: user.phone = data['phone']
        if 'organization' in data: user.organization = data['organization']
        if 'role' in data: user.role = data['role']
        user.save()
        from master_data.utils import log_audit
        log_audit(request.user, 'Updated User', 'User', str(pk))
        from accounts.serializers import UserSerializer
        return Response(UserSerializer(user).data)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        user.is_active = not user.is_active
        user.save()
        from master_data.utils import log_audit
        log_audit(request.user, f'{"Activated" if user.is_active else "Deactivated"} User', 'User', str(pk))
        return Response({'is_active': user.is_active})

class AdminUniversityListView(APIView):
    permission_classes = [IsGovAdmin]
    def get(self, request):
        from universities.serializers import UniversitySerializer
        unis = University.objects.all()
        data = []
        for u in unis:
            data.append({
                'id': u.id, 'name': u.name, 'state': u.state, 
                'contact_email': u.contact_email, 'is_active': u.is_active,
                'district_name': u.district.name if hasattr(u, 'district') and u.district else 'N/A',
                'spoc_username': u.spoc.username if u.spoc else None,
            })
        return Response(data)

    def post(self, request):
        from universities.serializers import UniversitySerializer
        serializer = UniversitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            from master_data.utils import log_audit
            log_audit(request.user, 'Created University', 'University', 'new', new_value=request.data.get('name'))
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class AdminUniversityDetailView(APIView):
    permission_classes = [IsGovAdmin]

    def put(self, request, pk):
        try:
            uni = University.objects.get(pk=pk)
        except University.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        from universities.serializers import UniversitySerializer
        serializer = UniversitySerializer(uni, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            from master_data.utils import log_audit
            log_audit(request.user, 'Updated University', 'University', str(pk))
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            uni = University.objects.get(pk=pk)
        except University.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        uni.is_active = not uni.is_active
        uni.save()
        from master_data.utils import log_audit
        log_audit(request.user, f'{"Activated" if uni.is_active else "Deactivated"} University', 'University', str(pk))
        return Response({'is_active': uni.is_active})

class AdminIndustryListView(APIView):
    permission_classes = [IsGovAdmin]
    def get(self, request):
        inds = IndustryPartner.objects.all().values('id', 'company_name', 'sector', 'contact_email', 'is_active', 'created_at', username=F('user__username'))
        return Response(list(inds))

class AdminIndustryDetailView(APIView):
    permission_classes = [IsGovAdmin]

    def put(self, request, pk):
        try:
            ind = IndustryPartner.objects.get(pk=pk)
        except IndustryPartner.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        data = request.data
        if 'company_name' in data: ind.company_name = data['company_name']
        if 'sector' in data: ind.sector = data['sector']
        if 'contact_email' in data: ind.contact_email = data['contact_email']
        ind.save()
        from master_data.utils import log_audit
        log_audit(request.user, 'Updated Industry Partner', 'IndustryPartner', str(pk))
        return Response({'id': ind.id, 'company_name': ind.company_name})

    def delete(self, request, pk):
        try:
            ind = IndustryPartner.objects.get(pk=pk)
        except IndustryPartner.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        ind.is_active = not ind.is_active
        ind.save()
        from master_data.utils import log_audit
        log_audit(request.user, f'{"Activated" if ind.is_active else "Deactivated"} Industry Partner', 'IndustryPartner', str(pk))
        return Response({'is_active': ind.is_active})

class GlobalSearchView(APIView):
    permission_classes = [IsGovAdmin]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])

        results = []
        
        challenges = Challenge.objects.filter(
            Q(reference_id__icontains=query) | Q(title__icontains=query)
        )[:5]
        for c in challenges:
            results.append({
                'type': 'CHALLENGE',
                'id': c.id,
                'title': f'{c.reference_id}: {c.title}',
                'status': c.status,
                'link': f'/admin/challenges/{c.id}'
            })

        from challenges.models import ProblemTwin
        twins = ProblemTwin.objects.filter(
            Q(reference_id__icontains=query) | Q(title__icontains=query)
        )[:5]
        for t in twins:
            results.append({
                'type': 'PROBLEM_TWIN',
                'id': t.id,
                'title': f'{t.reference_id}: {t.title}',
                'status': t.status,
                'link': f'/admin/problem-twins/{t.id}'
            })

        from accounts.models import User
        users = User.objects.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query) | Q(email__icontains=query)
        )[:5]
        for u in users:
            results.append({
                'type': 'USER',
                'id': u.id,
                'title': f'{u.get_full_name() or u.username} ({u.get_role_display()})',
                'status': 'Active' if u.is_active else 'Inactive',
                'link': '/admin/users'
            })

        from universities.models import University
        unis = University.objects.filter(
            Q(name__icontains=query) | Q(district__name__icontains=query)
        )[:5]
        for u in unis:
            results.append({
                'type': 'UNIVERSITY',
                'id': u.id,
                'title': u.name,
                'status': 'Active' if u.is_active else 'Inactive',
                'link': '/admin/universities'
            })

        industries = IndustryPartner.objects.filter(
            Q(company_name__icontains=query)
        )[:5]
        for ind in industries:
            results.append({
                'type': 'INDUSTRY',
                'id': ind.id,
                'title': ind.company_name,
                'status': 'Active' if ind.is_active else 'Inactive',
                'link': '/admin/industry'
            })

        return Response(results)
import csv
from django.http import HttpResponse

class ExportReportView(APIView):
    permission_classes = [IsGovAdmin]

    def get(self, request):
        report_type = request.query_params.get('type', 'challenges')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        
        writer = csv.writer(response)
        
        if report_type == 'challenges':
            writer.writerow(['ID', 'Reference ID', 'Title', 'Category', 'District', 'Status', 'Priority Level'])
            for c in Challenge.objects.all().select_related('category', 'district'):
                writer.writerow([
                    c.id, c.reference_id, c.title, 
                    c.category.name if c.category else 'N/A',
                    c.district.name if c.district else 'N/A',
                    c.status, c.priority_level
                ])
                
        elif report_type == 'users':
            writer.writerow(['ID', 'Username', 'Email', 'Role', 'Status', 'Joined Date'])
            from accounts.models import User
            for u in User.objects.all():
                writer.writerow([
                    u.id, u.username, u.email, u.get_role_display(), 
                    'Active' if u.is_active else 'Inactive', 
                    u.date_joined.strftime("%Y-%m-%d")
                ])
                
        elif report_type == 'universities':
            writer.writerow(['ID', 'Name', 'State', 'District', 'Status'])
            from universities.models import University
            for u in University.objects.all():
                writer.writerow([
                    u.id, u.name, u.state, u.district.name if getattr(u, 'district', None) else 'N/A',
                    'Active' if u.is_active else 'Inactive'
                ])
                
        else:
            writer.writerow(['Invalid Report Type'])
            
        return response
