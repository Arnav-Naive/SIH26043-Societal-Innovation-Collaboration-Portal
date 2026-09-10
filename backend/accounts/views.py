"""FILE PATH: backend/accounts/views.py  (REPLACE EXISTING FILE)"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import RegisterSerializer, UserSerializer, NotificationSerializer
from .models import User, Notification


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if self.user.role == User.ROLE_HEI_SPOC:
            from universities.models import University
            try:
                university = University.objects.get(spoc=self.user)
                if university.status == University.STATUS_PENDING:
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed('Account pending verification by Government Admin.')
                elif university.status == University.STATUS_REJECTED:
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed(f'Registration rejected: {university.rejection_reason}')
            except University.DoesNotExist:
                pass

        if self.user.role == User.ROLE_INDUSTRY:
            from industry.models import IndustryPartner
            try:
                partner = IndustryPartner.objects.get(user=self.user)
                if partner.status == IndustryPartner.STATUS_PENDING:
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed('Account pending verification by Government Admin.')
                elif partner.status == IndustryPartner.STATUS_REJECTED:
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed(f'Registration rejected: {partner.rejection_reason}')
                elif not partner.is_active:
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed('Your industry account has been deactivated. Contact admin.')
            except IndustryPartner.DoesNotExist:
                pass

        data['user'] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)

class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return self.request.user.notifications.all()

class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = request.user.notifications.get(pk=pk)
            notification.is_read = True
            notification.save()
            return Response({'status': 'marked as read'})
        except Exception:
            return Response(status=status.HTTP_404_NOT_FOUND)

class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.notifications.filter(is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'phone' in data: user.phone = data['phone']
        if 'organization' in data: user.organization = data['organization']
        if 'preferred_language' in data: user.preferred_language = data['preferred_language']

        if 'password' in data and data['password']:
            user.set_password(data['password'])

        user.save()
        return Response(UserSerializer(user).data)
