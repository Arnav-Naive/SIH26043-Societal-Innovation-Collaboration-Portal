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
    """Recommend universities based on challenge category."""
    permission_classes = [IsGovAdmin]

    def get(self, request, challenge_id):
        try:
            challenge = Challenge.objects.get(pk=challenge_id)
        except Challenge.DoesNotExist:
            return Response({'detail': 'Challenge not found.'}, status=404)

        universities = University.objects.all()
        serializer = UniversityMatchSerializer(
            universities, many=True,
            context={'category': challenge.category, 'request': request}
        )
        # Sort by relevance
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
        project_description = request.data.get('project_description', '')

        team = ProjectTeam.objects.create(
            challenge=challenge,
            university=university,
            faculty_mentor=faculty,
            students=students,
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
        allowed_fields = ('stage', 'project_description', 'students', 'faculty_mentor_id')
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
