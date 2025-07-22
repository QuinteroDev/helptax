# backend/accounts/auth_serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from dj_rest_auth.registration.serializers import RegisterSerializer
from .models import PerfilAutonomo


class CustomRegisterSerializer(RegisterSerializer):
    """Serializer personalizado para registro con campos adicionales"""
    nombre_fiscal = serializers.CharField(required=True, max_length=200)
    nif = serializers.CharField(required=True, max_length=9)
    direccion = serializers.CharField(required=True)
    codigo_postal = serializers.CharField(required=True, max_length=5)
    ciudad = serializers.CharField(required=True, max_length=100)
    provincia = serializers.CharField(required=True, max_length=100)
    tipo_irpf_default = serializers.IntegerField(default=7, required=False)
    
    def validate_nif(self, value):
        """Validar que el NIF no esté duplicado"""
        if PerfilAutonomo.objects.filter(nif=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este NIF")
        return value
    
    def validate(self, data):
        # Debug: imprimir los datos recibidos
        print("Datos recibidos:", data)
        return super().validate(data)
    
    def save(self, request):
        user = super().save(request)
        
        # Crear el perfil de autónomo
        PerfilAutonomo.objects.create(
            usuario=user,
            nombre_fiscal=self.validated_data.get('nombre_fiscal'),
            nif=self.validated_data.get('nif'),
            direccion=self.validated_data.get('direccion'),
            codigo_postal=self.validated_data.get('codigo_postal'),
            ciudad=self.validated_data.get('ciudad'),
            provincia=self.validated_data.get('provincia'),
            tipo_irpf_default=self.validated_data.get('tipo_irpf_default', 7)
        )
        
        return user


class PerfilAutonomoSerializer(serializers.ModelSerializer):
    """Serializer para el perfil del autónomo"""
    email = serializers.EmailField(source='usuario.email', read_only=True)
    
    class Meta:
        model = PerfilAutonomo
        fields = [
            'id', 'email', 'nombre_fiscal', 'nif', 'direccion',
            'codigo_postal', 'ciudad', 'provincia', 'tipo_irpf_default',
            'regimen_iva', 'fecha_alta', 'activo'
        ]
        read_only_fields = ['fecha_alta', 'activo']


class UserSerializer(serializers.ModelSerializer):
    """Serializer básico para User"""
    perfil = PerfilAutonomoSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'perfil']
        read_only_fields = ['id', 'email']