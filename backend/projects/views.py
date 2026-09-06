from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsHEISPOC, IsFacultyMentor, IsGovAdmin, IsHEISPOCOrFaculty
from universities.models import ProjectTeam
from .models import Milestone, MilestoneEvidence
from .serializers import MilestoneSerializer, MilestoneCreateSerializer, MilestoneEvidenceSerializer


class TeamMilestonesView(APIView):
    """List and create milestones for a team."""
    permission_classes = [IsAuthenticated]

    def get(self, request, team_id):
        try:
            team = ProjectTeam.objects.get(pk=team_id)
        except ProjectTeam.DoesNotExist:
            return Response({'detail': 'Team not found.'}, status=404)

        milestones = team.milestones.prefetch_related('evidence').all()
        serializer = MilestoneSerializer(milestones, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, team_id):
        if not (request.user.role in ('hei_spoc', 'gov_admin', 'faculty_mentor')):
            return Response({'detail': 'Permission denied.'}, status=403)

        try:
            team = ProjectTeam.objects.get(pk=team_id)
        except ProjectTeam.DoesNotExist:
            return Response({'detail': 'Team not found.'}, status=404)

        serializer = MilestoneCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        milestone = Milestone.objects.create(
            project_team=team,
            **serializer.validated_data
        )
        return Response(MilestoneSerializer(milestone, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


class MilestoneSubmitView(APIView):
    """HEI or Faculty submits milestone with optional evidence."""
    permission_classes = [IsHEISPOCOrFaculty]

    def post(self, request, pk):
        try:
            milestone = Milestone.objects.get(pk=pk)
        except Milestone.DoesNotExist:
            return Response({'detail': 'Milestone not found.'}, status=404)

        # Upload evidence files
        files = request.FILES.getlist('evidence')
        for f in files:
            MilestoneEvidence.objects.create(
                milestone=milestone,
                file=f,
                description=request.data.get('evidence_description', ''),
                uploaded_by=request.user,
            )

        milestone.status = Milestone.STATUS_SUBMITTED
        milestone.save()
        return Response(MilestoneSerializer(milestone, context={'request': request}).data)


class MilestoneApproveView(APIView):
    """Faculty mentor or admin approves a milestone."""
    permission_classes = [IsHEISPOCOrFaculty]

    def post(self, request, pk):
        try:
            milestone = Milestone.objects.get(pk=pk)
        except Milestone.DoesNotExist:
            return Response({'detail': 'Milestone not found.'}, status=404)

        action = request.data.get('action')  # 'approve' or 'request_changes'
        note = request.data.get('note', '')

        if action == 'approve':
            milestone.status = Milestone.STATUS_APPROVED
        elif action == 'request_changes':
            milestone.status = Milestone.STATUS_CHANGES_REQUESTED
        else:
            return Response({'detail': 'Invalid action. Use "approve" or "request_changes".'}, status=400)

        milestone.reviewed_by = request.user
        milestone.review_note = note
        milestone.save()

        # Check if all milestones approved → complete challenge
        team = milestone.project_team
        all_milestones = team.milestones.all()
        if all_milestones.exists() and all(m.status == Milestone.STATUS_APPROVED for m in all_milestones):
            from challenges.models import Challenge, ChallengeStatusHistory
            challenge = team.challenge
            if challenge.status != Challenge.STATUS_COMPLETED:
                challenge.status = Challenge.STATUS_COMPLETED
                challenge.save()
                ChallengeStatusHistory.objects.create(
                    challenge=challenge,
                    status=Challenge.STATUS_COMPLETED,
                    changed_by=request.user,
                    note='All milestones approved. Challenge marked as completed.',
                )

        return Response(MilestoneSerializer(milestone, context={'request': request}).data)
