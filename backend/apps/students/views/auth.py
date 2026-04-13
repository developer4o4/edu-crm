from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import authenticate
from apps.students.models import User
from apps.students.serializers import UserSerializer


class LoginView(APIView):
    """JWT Login"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'error': 'Username va parol kiritilishi shart'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)

        if not user:
            return Response(
                {'error': 'Username yoki parol noto\'g\'ri'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Hisobingiz faol emas'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    """Blacklist refresh token"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token kerak'}, status=400)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Tizimdan muvaffaqiyatli chiqdingiz'})
        except TokenError:
            return Response({'error': 'Token yaroqsiz'}, status=400)


class MeView(APIView):
    """Joriy foydalanuvchi ma'lumotlari"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        """Profilni yangilash"""
        allowed_fields = ['first_name', 'last_name', 'email', 'phone']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = UserSerializer(request.user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class ChangePasswordView(APIView):
    """Parolni o'zgartirish"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Eski va yangi parol kiritilishi shart'}, status=400)

        if not request.user.check_password(old_password):
            return Response({'error': 'Eski parol noto\'g\'ri'}, status=400)

        if len(new_password) < 8:
            return Response({'error': 'Yangi parol kamida 8 ta belgi bo\'lishi kerak'}, status=400)

        request.user.set_password(new_password)
        request.user.save()

        return Response({'message': 'Parol muvaffaqiyatli o\'zgartirildi'})


class TokenRefreshView(APIView):
    """Token refresh"""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token kerak'}, status=400)

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token),
            })
        except TokenError:
            return Response({'error': 'Refresh token yaroqsiz'}, status=400)
