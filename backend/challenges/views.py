from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from accounts.permissions import IsCitizen, IsGovAdmin, IsGovAdminOrHEISPOC
from .models import Challenge, ChallengeMedia, ChallengeStatusHistory
from .serializers import (
    ChallengeSubmitSerializer, ChallengeListSerializer,
    ChallengeDetailSerializer, ChallengeMediaSerializer
)
from .categorizer import categorize_challenge, compute_priority


class ChallengeSubmitView(APIView):
    permission_classes = [IsCitizen]

    def post(self, request):
        serializer = ChallengeSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Auto-categorize
        title = serializer.validated_data['title']
        description = serializer.validated_data['description']
        cat_result = categorize_challenge(title, description)
        priority = compute_priority(title, description, cat_result['category'])

        challenge = Challenge.objects.create(
            citizen=request.user,
            title=title,
            description=description,
            district=serializer.validated_data['district'],
            location=serializer.validated_data.get('location', ''),
            category=cat_result['category'],
            category_confidence=cat_result['confidence'],
            category_reason=cat_result['reason'],
            priority=priority,
            status=Challenge.STATUS_SUBMITTED,
        )

        # Handle uploaded media files
        files = request.FILES.getlist('media')
        for f in files:
            media_type = 'image' if f.content_type.startswith('image') else 'document'
            ChallengeMedia.objects.create(
                challenge=challenge,
                file=f,
                media_type=media_type,
            )

        # Record status history
        ChallengeStatusHistory.objects.create(
            challenge=challenge,
            status=Challenge.STATUS_SUBMITTED,
            changed_by=request.user,
            note='Challenge submitted by citizen.',
        )

        return Response(ChallengeDetailSerializer(challenge, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


class CitizenChallengeListView(generics.ListAPIView):
    permission_classes = [IsCitizen]
    serializer_class = ChallengeListSerializer

    def get_queryset(self):
        return Challenge.objects.filter(citizen=self.request.user).order_by('-created_at')


class AdminChallengeListView(generics.ListAPIView):
    permission_classes = [IsGovAdmin]
    serializer_class = ChallengeListSerializer

    def get_queryset(self):
        qs = Challenge.objects.select_related('citizen', 'assigned_university').order_by('-created_at')
        q = self.request.query_params.get('q', '')
        category = self.request.query_params.get('category', '')
        district = self.request.query_params.get('district', '')
        status_filter = self.request.query_params.get('status', '')
        priority = self.request.query_params.get('priority', '')

        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(reference_id__icontains=q) | Q(district__icontains=q))
        if category:
            qs = qs.filter(category=category)
        if district:
            qs = qs.filter(district__icontains=district)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if priority:
            qs = qs.filter(priority=priority)
        return qs


class AllRolesChallengeListView(generics.ListAPIView):
    """For HEI/Faculty/Industry to see assigned challenges."""
    permission_classes = [IsAuthenticated]
    serializer_class = ChallengeListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'hei_spoc':
            from universities.models import University
            try:
                uni = University.objects.get(spoc=user)
                return Challenge.objects.filter(assigned_university=uni).order_by('-created_at')
            except University.DoesNotExist:
                return Challenge.objects.none()
        return Challenge.objects.none()


class ChallengeDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChallengeDetailSerializer

    def get_queryset(self):
        return Challenge.objects.select_related(
            'citizen', 'assigned_university'
        ).prefetch_related('media', 'status_history__changed_by')

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        # Permission checks
        if user.role == 'citizen' and obj.citizen != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to view this challenge.')
        return obj


class ChallengeReviewView(APIView):
    """Admin marks a challenge as UNDER_REVIEW."""
    permission_classes = [IsGovAdmin]

    def post(self, request, pk):
        try:
            challenge = Challenge.objects.get(pk=pk)
        except Challenge.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if challenge.status != Challenge.STATUS_SUBMITTED:
            return Response({'detail': 'Challenge is not in SUBMITTED state.'}, status=400)

        challenge.status = Challenge.STATUS_UNDER_REVIEW
        challenge.save()

        ChallengeStatusHistory.objects.create(
            challenge=challenge,
            status=Challenge.STATUS_UNDER_REVIEW,
            changed_by=request.user,
            note=request.data.get('note', 'Under review by government administrator.'),
        )

        return Response(ChallengeDetailSerializer(challenge, context={'request': request}).data)


class ChallengeRouteView(APIView):
    """Admin routes a challenge to a university."""
    permission_classes = [IsGovAdmin]

    def post(self, request, pk):
        from universities.models import University
        try:
            challenge = Challenge.objects.get(pk=pk)
        except Challenge.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        university_id = request.data.get('university_id')
        note = request.data.get('note', '')

        if not university_id:
            return Response({'detail': 'university_id is required.'}, status=400)

        try:
            university = University.objects.get(pk=university_id)
        except University.DoesNotExist:
            return Response({'detail': 'University not found.'}, status=404)

        challenge.assigned_university = university
        challenge.status = Challenge.STATUS_ROUTED
        challenge.routing_note = note
        challenge.save()

        ChallengeStatusHistory.objects.create(
            challenge=challenge,
            status=Challenge.STATUS_ROUTED,
            changed_by=request.user,
            note=f'Routed to {university.name}. {note}',
        )
        
        from master_data.utils import log_audit
        log_audit(
            user=request.user,
            action='Routed Challenge',
            entity_type='Challenge',
            entity_id=challenge.reference_id,
            new_value=f'University: {university.name}'
        )

        return Response(ChallengeDetailSerializer(challenge, context={'request': request}).data)


class ChallengePriorityUpdateView(APIView):
    """Admin can override priority."""
    permission_classes = [IsGovAdmin]

    def patch(self, request, pk):
        try:
            challenge = Challenge.objects.get(pk=pk)
        except Challenge.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        priority = request.data.get('priority')
        if priority not in ('LOW', 'MEDIUM', 'HIGH'):
            return Response({'detail': 'Invalid priority.'}, status=400)

        challenge.priority = priority
        challenge.save()
        return Response({'priority': challenge.priority})
