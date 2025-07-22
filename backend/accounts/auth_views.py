# backend/accounts/auth_views.py

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import PerfilAutonomo
from .auth_serializers import PerfilAutonomoSerializer, UserSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Vista para obtener y actualizar el usuario actual"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class PerfilAutonomoView(generics.RetrieveUpdateAPIView):
    """Vista para obtener y actualizar el perfil del autónomo"""
    serializer_class = PerfilAutonomoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user.perfil


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
    """Endpoint para verificar si el usuario está autenticado"""
    return Response({
        'is_authenticated': True,
        'email': request.user.email,
        'nombre': request.user.perfil.nombre_fiscal if hasattr(request.user, 'perfil') else None
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def check_nif(request):
    """Verificar si un NIF ya está registrado"""
    nif = request.data.get('nif', '')
    exists = PerfilAutonomo.objects.filter(nif=nif).exists()
    return Response({'exists': exists})