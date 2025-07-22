# backend/accounts/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Q
from datetime import date, timedelta
from decimal import Decimal

from .models import Ingreso, Gasto, PerfilAutonomo
from .serializers import (
    IngresoSerializer, GastoSerializer, ResumenTrimestralSerializer,
    ResumenCalculadoSerializer, BulkIngresoSerializer, BulkGastoSerializer
)


class IngresoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Ingresos - Multi-tenant"""
    serializer_class = IngresoSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    permission_classes = [IsAuthenticated]  # Solo usuarios autenticados
    
    def get_queryset(self):
        """
        Filtra ingresos solo del usuario autenticado
        ESTO ES CLAVE PARA MULTI-TENANT
        """
        queryset = Ingreso.objects.filter(usuario=self.request.user)
        
        # Mantener los filtros existentes
        trimestre = self.request.query_params.get('trimestre', None)
        año = self.request.query_params.get('año', None)
        
        if trimestre:
            queryset = queryset.filter(trimestre=trimestre)
        if año:
            queryset = queryset.filter(año=año)
            
        return queryset
    
    def perform_create(self, serializer):
        """Asigna automáticamente el usuario al crear"""
        serializer.save(usuario=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Crear múltiples ingresos de una vez"""
        serializer = BulkIngresoSerializer(data=request.data)
        if serializer.is_valid():
            ingresos_data = serializer.validated_data['ingresos']
            ingresos = []
            for ingreso_data in ingresos_data:
                ingreso = Ingreso.objects.create(
                    usuario=request.user,  # Asignar usuario
                    **ingreso_data
                )
                ingresos.append(ingreso)
            
            return Response(
                IngresoSerializer(ingresos, many=True).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GastoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Gastos - Multi-tenant"""
    serializer_class = GastoSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtra gastos solo del usuario autenticado"""
        queryset = Gasto.objects.filter(usuario=self.request.user)
        
        trimestre = self.request.query_params.get('trimestre', None)
        año = self.request.query_params.get('año', None)
        
        if trimestre:
            queryset = queryset.filter(trimestre=trimestre)
        if año:
            queryset = queryset.filter(año=año)
            
        return queryset
    
    def perform_create(self, serializer):
        """Asigna automáticamente el usuario al crear"""
        serializer.save(usuario=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Crear múltiples gastos de una vez"""
        serializer = BulkGastoSerializer(data=request.data)
        if serializer.is_valid():
            gastos_data = serializer.validated_data['gastos']
            gastos = []
            for gasto_data in gastos_data:
                gasto = Gasto.objects.create(
                    usuario=request.user,  # Asignar usuario
                    **gasto_data
                )
                gastos.append(gasto)
            
            return Response(
                GastoSerializer(gastos, many=True).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumenTrimestralViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para ver resúmenes trimestrales - Multi-tenant"""
    serializer_class = ResumenTrimestralSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Los resúmenes se calculan dinámicamente, no se almacenan
        return []
    
    @action(detail=False)
    def calcular(self, request):
        """Calcula el resumen de un trimestre para el usuario autenticado"""
        trimestre = request.query_params.get('trimestre', None)
        año = request.query_params.get('año', date.today().year)
        
        if not trimestre:
            return Response(
                {"error": "Debe especificar el trimestre"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            trimestre = int(trimestre)
            año = int(año)
        except ValueError:
            return Response(
                {"error": "Trimestre y año deben ser números"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcular fechas del trimestre
        trimestre_meses = {
            1: (1, 3),
            2: (4, 6),
            3: (7, 9),
            4: (10, 12)
        }
        
        if trimestre not in trimestre_meses:
            return Response(
                {"error": "Trimestre debe ser 1, 2, 3 o 4"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mes_inicio, mes_fin = trimestre_meses[trimestre]
        fecha_inicio = date(año, mes_inicio, 1)
        
        if mes_fin == 12:
            fecha_fin = date(año, 12, 31)
        else:
            fecha_fin = date(año, mes_fin + 1, 1) - timedelta(days=1)
        
        # IMPORTANTE: Filtrar por usuario
        ingresos = Ingreso.objects.filter(
            usuario=request.user,  # Solo SUS ingresos
            trimestre=trimestre,
            año=año
        )
        
        # Calcular totales
        ingresos_data = ingresos.aggregate(
            total=Sum('importe') or Decimal('0'),
        )
        
        iva_repercutido = Decimal('0')
        irpf_retenido = Decimal('0')
        
        for ingreso in ingresos:
            iva_repercutido += ingreso.iva_importe
            irpf_retenido += ingreso.irpf_importe
        
        # IMPORTANTE: Filtrar por usuario
        gastos = Gasto.objects.filter(
            usuario=request.user,  # Solo SUS gastos
            trimestre=trimestre,
            año=año
        )
        
        gastos_data = gastos.aggregate(
            total=Sum('importe') or Decimal('0'),
        )
        
        iva_soportado = Decimal('0')
        for gasto in gastos:
            iva_soportado += gasto.iva_importe
        
        # Cálculos finales
        ingresos_totales = ingresos_data['total'] or Decimal('0')
        gastos_totales = gastos_data['total'] or Decimal('0')
        beneficio_neto = ingresos_totales - gastos_totales
        iva_a_pagar = iva_repercutido - iva_soportado
        irpf_a_ingresar = beneficio_neto * Decimal('0.20')
        
        data = {
            'trimestre': trimestre,
            'año': año,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'ingresos_totales': ingresos_totales,
            'iva_repercutido': iva_repercutido,
            'irpf_retenido': irpf_retenido,
            'gastos_totales': gastos_totales,
            'iva_soportado': iva_soportado,
            'beneficio_neto': beneficio_neto,
            'iva_a_pagar': iva_a_pagar,
            'irpf_a_ingresar': irpf_a_ingresar,
            'ingresos_detalle': ingresos,
            'gastos_detalle': gastos
        }
        
        serializer = ResumenCalculadoSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Estadísticas generales del usuario para el dashboard"""
        año_actual = date.today().year
        
        # Total ingresos del año
        ingresos_año = Ingreso.objects.filter(
            usuario=request.user,
            año=año_actual
        ).aggregate(total=Sum('importe'))['total'] or Decimal('0')
        
        # Total gastos del año
        gastos_año = Gasto.objects.filter(
            usuario=request.user,
            año=año_actual
        ).aggregate(total=Sum('importe'))['total'] or Decimal('0')
        
        # Número de clientes únicos
        clientes_unicos = Ingreso.objects.filter(
            usuario=request.user
        ).values('cliente').distinct().count()
        
        return Response({
            'ingresos_año': ingresos_año,
            'gastos_año': gastos_año,
            'beneficio_año': ingresos_año - gastos_año,
            'clientes_unicos': clientes_unicos,
        })