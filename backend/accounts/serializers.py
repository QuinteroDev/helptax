# backend/accounts/serializers.py

from rest_framework import serializers
from .models import Ingreso, Gasto, ResumenTrimestral
from decimal import Decimal
from django.db.models import Sum


class IngresoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Ingreso"""
    iva_importe = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    irpf_importe = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Ingreso
        fields = [
            'id', 'fecha', 'descripcion', 'cliente', 'importe',
            'iva_porcentaje', 'iva_importe', 'irpf_porcentaje', 
            'irpf_importe', 'total', 'trimestre', 'año'
        ]
        
    def validate(self, data):
        """Validación personalizada"""
        if data.get('importe', 0) <= 0:
            raise serializers.ValidationError("El importe debe ser mayor que 0")
        return data


class GastoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Gasto"""
    iva_importe = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    factura_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Gasto
        fields = [
            'id', 'fecha', 'descripcion', 'proveedor', 'importe',
            'iva_porcentaje', 'iva_importe', 'total', 'factura',
            'factura_url', 'trimestre', 'año'
        ]
        
    def get_factura_url(self, obj):
        """Obtiene la URL completa de la factura"""
        if obj.factura:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.factura.url)
        return None
    
    def validate(self, data):
        """Validación personalizada"""
        if data.get('importe', 0) <= 0:
            raise serializers.ValidationError("El importe debe ser mayor que 0")
        return data


class ResumenTrimestralSerializer(serializers.ModelSerializer):
    """Serializer para el resumen trimestral"""
    fecha_inicio = serializers.SerializerMethodField()
    fecha_fin = serializers.SerializerMethodField()
    
    class Meta:
        model = ResumenTrimestral
        fields = [
            'id', 'trimestre', 'año', 'fecha_inicio', 'fecha_fin',
            'ingresos_totales', 'gastos_totales', 'beneficio_neto',
            'iva_repercutido', 'iva_soportado', 'iva_a_pagar',
            'irpf_retenido'
        ]
        
    def get_fecha_inicio(self, obj):
        """Calcula la fecha de inicio del trimestre"""
        trimestre_meses = {
            1: 1,  # Q1 empieza en enero
            2: 4,  # Q2 empieza en abril
            3: 7,  # Q3 empieza en julio
            4: 10  # Q4 empieza en octubre
        }
        mes = trimestre_meses[obj.trimestre]
        return f"{obj.año}-{mes:02d}-01"
    
    def get_fecha_fin(self, obj):
        """Calcula la fecha de fin del trimestre"""
        trimestre_meses = {
            1: 3,   # Q1 termina en marzo
            2: 6,   # Q2 termina en junio
            3: 9,   # Q3 termina en septiembre
            4: 12   # Q4 termina en diciembre
        }
        mes = trimestre_meses[obj.trimestre]
        dias_mes = {
            3: 31, 6: 30, 9: 30, 12: 31
        }
        return f"{obj.año}-{mes:02d}-{dias_mes[mes]}"


class ResumenCalculadoSerializer(serializers.Serializer):
    """Serializer para calcular el resumen en tiempo real sin guardarlo"""
    trimestre = serializers.IntegerField()
    año = serializers.IntegerField()
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
    
    # Ingresos
    ingresos_totales = serializers.DecimalField(max_digits=10, decimal_places=2)
    iva_repercutido = serializers.DecimalField(max_digits=10, decimal_places=2)
    irpf_retenido = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    # Gastos
    gastos_totales = serializers.DecimalField(max_digits=10, decimal_places=2)
    iva_soportado = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    # Resultados
    beneficio_neto = serializers.DecimalField(max_digits=10, decimal_places=2)
    iva_a_pagar = serializers.DecimalField(max_digits=10, decimal_places=2)
    irpf_a_ingresar = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    # Detalles
    ingresos_detalle = IngresoSerializer(many=True, read_only=True)
    gastos_detalle = GastoSerializer(many=True, read_only=True)


class BulkIngresoSerializer(serializers.Serializer):
    """Serializer para crear múltiples ingresos de una vez"""
    ingresos = IngresoSerializer(many=True)
    
    def create(self, validated_data):
        ingresos_data = validated_data.pop('ingresos')
        ingresos = []
        for ingreso_data in ingresos_data:
            ingreso = Ingreso.objects.create(**ingreso_data)
            ingresos.append(ingreso)
        return {'ingresos': ingresos}


class BulkGastoSerializer(serializers.Serializer):
    """Serializer para crear múltiples gastos de una vez"""
    gastos = GastoSerializer(many=True)
    
    def create(self, validated_data):
        gastos_data = validated_data.pop('gastos')
        gastos = []
        for gasto_data in gastos_data:
            gasto = Gasto.objects.create(**gasto_data)
            gastos.append(gasto)
        return {'gastos': gastos}