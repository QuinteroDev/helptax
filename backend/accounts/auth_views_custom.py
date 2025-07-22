# backend/accounts/auth_views_custom.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import PerfilAutonomo
import json

@api_view(['POST'])
@permission_classes([AllowAny])
def custom_login(request):
    """Vista de login personalizada"""
    try:
        data = request.data
        print("Datos recibidos en login:", json.dumps(data, indent=2))
        
        # Obtener email y password
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email y contraseña son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Intentar autenticar con el email como username
        user = authenticate(username=email, password=password)
        
        if not user:
            # Si falla, intentar buscar el usuario por email
            try:
                user_obj = User.objects.get(email=email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        
        if not user:
            return Response({
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Obtener perfil si existe
        perfil_data = None
        try:
            perfil = user.perfil
            perfil_data = {
                'nombre_fiscal': perfil.nombre_fiscal,
                'nif': perfil.nif,
                'ciudad': perfil.ciudad
            }
        except:
            pass
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'perfil': perfil_data
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print("Error en login:", str(e))
        return Response({
            'error': 'Error al procesar el login',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def custom_register(request):
    """Vista de registro personalizada con mejor manejo de errores"""
    try:
        data = request.data
        print("Datos recibidos en registro:", json.dumps(data, indent=2))
        
        # Validar campos requeridos
        required_fields = ['email', 'password1', 'password2', 'nombre_fiscal', 'nif', 
                          'direccion', 'codigo_postal', 'ciudad', 'provincia']
        
        missing_fields = []
        for field in required_fields:
            if field not in data or not data[field]:
                missing_fields.append(field)
        
        if missing_fields:
            return Response({
                'error': 'Campos requeridos faltantes',
                'missing_fields': missing_fields,
                'received_fields': list(data.keys())
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar contraseñas
        if data['password1'] != data['password2']:
            return Response({
                'error': 'Las contraseñas no coinciden'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que el email no exista
        if User.objects.filter(email=data['email']).exists():
            return Response({
                'error': 'Ya existe un usuario con este email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que el NIF no exista
        if PerfilAutonomo.objects.filter(nif=data['nif']).exists():
            return Response({
                'error': 'Ya existe un usuario con este NIF'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear usuario
        user = User.objects.create_user(
            username=data['email'],  # Usamos email como username
            email=data['email'],
            password=data['password1']
        )
        
        # Crear perfil de autónomo
        perfil = PerfilAutonomo.objects.create(
            usuario=user,
            nombre_fiscal=data['nombre_fiscal'],
            nif=data['nif'],
            direccion=data['direccion'],
            codigo_postal=data['codigo_postal'],
            ciudad=data['ciudad'],
            provincia=data['provincia'],
            tipo_irpf_default=data.get('tipo_irpf_default', 7)
        )
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'perfil': {
                    'nombre_fiscal': perfil.nombre_fiscal,
                    'nif': perfil.nif
                }
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print("Error en registro:", str(e))
        return Response({
            'error': 'Error al procesar el registro',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)