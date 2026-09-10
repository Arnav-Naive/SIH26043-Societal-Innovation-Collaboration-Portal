from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsGovAdmin, IsHEISPOC, IsFacultyMentor, IsHEISPOCOrFaculty
from challenges.models import Challenge, ChallengeStatusHistory
from .models import University, ProjectTeam
from .serializers import UniversitySerializer, UniversityMatchSerializer, ProjectTeamSerializer


class UniversityListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UniversitySerializer
    queryset = University.objects.all()


class UniversityRecommendView(APIView):
    """Recommend universities for a challenge using the semantic
    Problem-to-University Matching Engine (TF-IDF + cosine similarity
    over normalized challenge text vs. declared expertise areas)."""
    permission_classes = [IsGovAdmin]

    def get(self, request, challenge_id):
        try:
            challenge = Challenge.objects.select_related('category').get(pk=challenge_id)
        except Challenge.DoesNotExist:
            return Response({'detail': 'Challenge not found.'}, status=404)

        universities = University.objects.prefetch_related('expertise_areas').all()

        from .matching import compute_university_matches
        match_results = compute_university_matches(challenge, universities)
        scores = {
            r['university_id']: {'score': r['score'], 'reason': r['reason']}
            for r in match_results
        }

        serializer = UniversityMatchSerializer(
            universities, many=True,
            context={'scores': scores, 'request': request}
        )
        data = sorted(serializer.data, key=lambda u: u['relevance_score'], reverse=True)
        return Response(data)


class HEIAssignedChallengesView(APIView):
    """HEI SPOC sees challenges assigned to their university."""
    permission_classes = [IsHEISPOC]

    def get(self, request):
        try:
            university = University.objects.get(spoc=request.user)
        except University.DoesNotExist:
            return Response({'detail': 'No university linked to your account.'}, status=404)

        from challenges.serializers import ChallengeListSerializer
        challenges = Challenge.objects.filter(
            assigned_university=university
        ).order_by('-created_at')
        serializer = ChallengeListSerializer(challenges, many=True, context={'request': request})
        return Response(serializer.data)


class HEIDashboardStatsView(APIView):
    """Stats for the HEI SPOC dashboard."""
    permission_classes = [IsHEISPOC]

    def get(self, request):
        try:
            university = University.objects.get(spoc=request.user)
        except University.DoesNotExist:
            return Response({'detail': 'No university linked to your account.'}, status=404)

        assigned_challenges_count = Challenge.objects.filter(
            assigned_university=university,
            status=Challenge.STATUS_ROUTED
        ).count()

        accepted_challenges_count = Challenge.objects.filter(
            assigned_university=university,
            status=Challenge.STATUS_ACCEPTED
        ).count()

        active_projects_count = ProjectTeam.objects.filter(
            university=university
        ).exclude(stage=ProjectTeam.STAGE_IMPACT).count()

        completed_projects_count = ProjectTeam.objects.filter(
            university=university,
            stage=ProjectTeam.STAGE_IMPACT
        ).count()

        return Response({
            'assigned_challenges': assigned_challenges_count,
            'accepted_challenges': accepted_challenges_count,
            'active_projects': active_projects_count,
            'completed_projects': completed_projects_count,
            'total_challenges': assigned_challenges_count + accepted_challenges_count,
            'total_projects': active_projects_count + completed_projects_count
        })




class HEIChallengeActionView(APIView):
    """HEI SPOC can accept or reject an assigned challenge."""
    permission_classes = [IsHEISPOC]

    def post(self, request, challenge_id):
        try:
            university = University.objects.get(spoc=request.user)
            challenge = Challenge.objects.get(pk=challenge_id, assigned_university=university)
        except (University.DoesNotExist, Challenge.DoesNotExist):
            return Response({'detail': 'Challenge not found or not assigned to you.'}, status=404)

        action = request.data.get('action')
        reason = request.data.get('reason', '')

        if action == 'accept':
            if challenge.status != Challenge.STATUS_ROUTED:
                return Response({'detail': 'Challenge is not in ROUTED state.'}, status=400)
            challenge.status = Challenge.STATUS_ACCEPTED
            challenge.save()
            ChallengeStatusHistory.objects.create(
                challenge=challenge,
                status=Challenge.STATUS_ACCEPTED,
                changed_by=request.user,
                note='Challenge accepted by HEI.'
            )
            return Response({'detail': 'Challenge accepted.'})

        elif action == 'reject':
            if challenge.status != Challenge.STATUS_ROUTED:
                return Response({'detail': 'Challenge is not in ROUTED state.'}, status=400)
            if not reason:
                return Response({'detail': 'Reason is required for rejection.'}, status=400)
            challenge.status = Challenge.STATUS_REJECTED
            challenge.save()
            ChallengeStatusHistory.objects.create(
                challenge=challenge,
                status=Challenge.STATUS_REJECTED,
                changed_by=request.user,
                note=f'Challenge rejected by HEI. Reason: {reason}'
            )
            return Response({'detail': 'Challenge rejected.'})

        return Response({'detail': 'Invalid action.'}, status=400)




class FormTeamView(APIView):
    """HEI SPOC forms a project team for an assigned challenge."""
    permission_classes = [IsHEISPOC]

    def post(self, request, challenge_id):
        try:
            challenge = Challenge.objects.get(pk=challenge_id)
        except Challenge.DoesNotExist:
            return Response({'detail': 'Challenge not found.'}, status=404)

        try:
            university = University.objects.get(spoc=request.user)
        except University.DoesNotExist:
            return Response({'detail': 'No university linked to your account.'}, status=404)

        if challenge.assigned_university != university:
            return Response({'detail': 'Challenge is not assigned to your university.'}, status=403)

        if hasattr(challenge, 'project_team'):
            return Response({'detail': 'Team already formed for this challenge.'}, status=400)

        # Get faculty mentor
        faculty_id = request.data.get('faculty_mentor_id')
        faculty = None
        if faculty_id:
            from accounts.models import User
            try:
                faculty = User.objects.get(pk=faculty_id, role='faculty_mentor')
            except User.DoesNotExist:
                return Response({'detail': 'Faculty mentor not found.'}, status=404)

        students = request.data.get('students', [])
        project_title = request.data.get('project_title', '')
        objective = request.data.get('objective', '')
        domain = request.data.get('domain', '')
        project_description = request.data.get('project_description', '')

        team = ProjectTeam.objects.create(
            challenge=challenge,
            university=university,
            faculty_mentor=faculty,
            students=students,
            project_title=project_title,
            objective=objective,
            domain=domain,
            project_description=project_description,
            stage=ProjectTeam.STAGE_FORMED,
        )

        # Update challenge status
        challenge.status = Challenge.STATUS_IN_PROGRESS
        challenge.save()

        ChallengeStatusHistory.objects.create(
            challenge=challenge,
            status=Challenge.STATUS_IN_PROGRESS,
            changed_by=request.user,
            note=f'Project team formed at {university.name}.',
        )

        serializer = ProjectTeamSerializer(team, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class HEIMyTeamsView(generics.ListAPIView):
    permission_classes = [IsHEISPOC]
    serializer_class = ProjectTeamSerializer

    def get_queryset(self):
        try:
            university = University.objects.get(spoc=self.request.user)
            return ProjectTeam.objects.filter(university=university).select_related(
                'challenge', 'faculty_mentor', 'university'
            ).order_by('-created_at')
        except University.DoesNotExist:
            return ProjectTeam.objects.none()


class FacultyMyTeamsView(generics.ListAPIView):
    permission_classes = [IsFacultyMentor]
    serializer_class = ProjectTeamSerializer

    def get_queryset(self):
        return ProjectTeam.objects.filter(
            faculty_mentor=self.request.user
        ).select_related('challenge', 'university').order_by('-created_at')


class ProjectTeamDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsHEISPOCOrFaculty]
    serializer_class = ProjectTeamSerializer

    def get_queryset(self):
        return ProjectTeam.objects.select_related(
            'challenge', 'university', 'faculty_mentor'
        ).prefetch_related('milestones')

    def update(self, request, *args, **kwargs):
        """HEI SPOC can update stage and description."""
        instance = self.get_object()
        allowed_fields = ('stage', 'project_title', 'objective', 'domain', 'project_description', 'students', 'faculty_mentor_id')
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FacultyListView(generics.ListAPIView):
    """List all faculty mentors for team formation form."""
    permission_classes = [IsHEISPOC]

    def get(self, request):
        from accounts.models import User
        from accounts.serializers import UserSerializer
        faculties = User.objects.filter(role='faculty_mentor')
        serializer = UserSerializer(faculties, many=True)
        return Response(serializer.data)


from rest_framework.permissions import AllowAny
from django.db import transaction

class HEIRegistrationView(APIView):
    """Public endpoint to register a new HEI and SPOC account."""
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        from accounts.models import User
        from master_data.models import District

        try:
            district = District.objects.get(name=data.get('district', ''))
        except District.DoesNotExist:
            return Response({'detail': 'Invalid district provided.'}, status=400)

        if User.objects.filter(username=data.get('username')).exists():
            return Response({'detail': 'Username already exists.'}, status=400)
        
        if User.objects.filter(email=data.get('email')).exists():
            return Response({'detail': 'Email already exists.'}, status=400)

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=data.get('username'),
                    email=data.get('email'),
                    password=data.get('password'),
                    first_name=data.get('first_name', ''),
                    last_name=data.get('last_name', ''),
                    role=User.ROLE_HEI_SPOC,
                    phone=data.get('phone', ''),
                    district=district.name,
                    organization=data.get('name', '')
                )
                
                university = University.objects.create(
                    name=data.get('name'),
                    institution_type=data.get('institution_type', ''),
                    registration_id=data.get('registration_id', ''),
                    address=data.get('address', ''),
                    district=district,
                    state=data.get('state', 'Jharkhand'),
                    website=data.get('website', ''),
                    contact_email=data.get('email', ''),
                    contact_phone=data.get('phone', ''),
                    designation=data.get('designation', ''),
                    departments=data.get('departments', ''),
                    facilities=data.get('facilities', ''),
                    spoc=user,
                    status=University.STATUS_PENDING,
                    is_active=False
                )

                if 'verification_document' in request.FILES:
                    university.verification_document = request.FILES['verification_document']
                    university.save()

            return Response({'detail': 'Registration successful. Pending admin approval.'}, status=201)
        except Exception as e:
            return Response({'detail': str(e)}, status=400)


class AdminHEIApprovalView(generics.ListAPIView):
    """Admin view to list pending HEI applications and approve/reject them."""
    permission_classes = [IsGovAdmin]
    
    def get_queryset(self):
        from .serializers import AdminHEIApprovalSerializer
        return University.objects.filter(status=University.STATUS_PENDING).select_related('spoc', 'district')
        
    def get(self, request, *args, **kwargs):
        from .serializers import AdminHEIApprovalSerializer
        queryset = self.get_queryset()
        serializer = AdminHEIApprovalSerializer(queryset, many=True)
        return Response(serializer.data)

class AdminHEIActionView(APIView):
    permission_classes = [IsGovAdmin]

    def post(self, request, pk):
        try:
            university = University.objects.get(pk=pk, status=University.STATUS_PENDING)
        except University.DoesNotExist:
            return Response({'detail': 'Pending HEI not found.'}, status=404)

        action = request.data.get('action')
        reason = request.data.get('reason', '')

        if action == 'approve':
            university.status = University.STATUS_APPROVED
            university.is_active = True
            university.save()
            # Also ensure the linked SPOC user account is active
            if university.spoc:
                university.spoc.is_active = True
                university.spoc.save(update_fields=['is_active'])
            return Response({'detail': 'HEI Approved.'})
            
        elif action == 'reject':
            if not reason:
                return Response({'detail': 'Reason required for rejection.'}, status=400)
            university.status = University.STATUS_REJECTED
            university.rejection_reason = reason
            university.save()
            return Response({'detail': 'HEI Rejected.'})

        return Response({'detail': 'Invalid action.'}, status=400)
