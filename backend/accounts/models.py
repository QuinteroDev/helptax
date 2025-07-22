# backend/accounts/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User
from decimal import Decimal

class Ingreso(models.Model):
    """Modelo para registrar ingresos trimestrales"""
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ingresos')
    fecha = models.DateField()
    descripcion = models.CharField(max_length=200)
    cliente = models.CharField(max_length=100)
    importe = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    iva_porcentaje = models.IntegerField(
        default=21,
        choices=[(0, '0%'), (21, '21%')],
        validators=[MinValueValidator(0), MaxValueValidator(21)]
    )
    irpf_porcentaje = models.IntegerField(
        default=7,
        validators=[MinValueValidator(0), MaxValueValidator(20)]
    )
    trimestre = models.IntegerField(
        choices=[
            (1, 'Q1 - Primer Trimestre'),
            (2, 'Q2 - Segundo Trimestre'),
            (3, 'Q3 - Tercer Trimestre'),
            (4, 'Q4 - Cuarto Trimestre'),
        ]
    )
    año = models.IntegerField(default=2025)
    
    @property
    def iva_importe(self):
        """Calcula el importe del IVA"""
        return self.importe * Decimal(self.iva_porcentaje) / 100
    
    @property
    def irpf_importe(self):
        """Calcula el importe del IRPF"""
        return self.importe * Decimal(self.irpf_porcentaje) / 100
    
    @property
    def total(self):
        """Calcula el total con IVA"""
        return self.importe + self.iva_importe
    
    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Ingreso'
        verbose_name_plural = 'Ingresos'
        # Índice para mejorar queries por usuario
        indexes = [
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['usuario', 'trimestre', 'año']),
        ]
    
    def __str__(self):
        return f"{self.fecha} - {self.cliente} - {self.importe}€"


class Gasto(models.Model):
    """Modelo para registrar gastos deducibles"""
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gastos')
    fecha = models.DateField()
    descripcion = models.CharField(max_length=200)
    proveedor = models.CharField(max_length=100)
    importe = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    iva_porcentaje = models.IntegerField(
        default=21,
        choices=[(0, '0%'), (21, '21%')],
        validators=[MinValueValidator(0), MaxValueValidator(21)]
    )
    factura = models.FileField(
        upload_to='facturas/%Y/%m/', 
        blank=True, 
        null=True,
        help_text='Adjuntar factura en PDF'
    )
    trimestre = models.IntegerField(
        choices=[
            (1, 'Q1 - Primer Trimestre'),
            (2, 'Q2 - Segundo Trimestre'),
            (3, 'Q3 - Tercer Trimestre'),
            (4, 'Q4 - Cuarto Trimestre'),
        ]
    )
    año = models.IntegerField(default=2025)
    
    @property
    def iva_importe(self):
        """Calcula el importe del IVA"""
        return self.importe * Decimal(self.iva_porcentaje) / 100
    
    @property
    def total(self):
        """Calcula el total con IVA"""
        return self.importe + self.iva_importe
    
    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Gasto'
        verbose_name_plural = 'Gastos'
        # Índice para mejorar queries por usuario
        indexes = [
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['usuario', 'trimestre', 'año']),
        ]
    
    def __str__(self):
        return f"{self.fecha} - {self.proveedor} - {self.importe}€"


# Modelo de perfil de usuario (opcional pero útil)
class PerfilAutonomo(models.Model):
    """Perfil extendido para autónomos"""
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    nombre_fiscal = models.CharField(max_length=200)
    nif = models.CharField(max_length=9, unique=True)
    direccion = models.TextField()
    codigo_postal = models.CharField(max_length=5)
    ciudad = models.CharField(max_length=100)
    provincia = models.CharField(max_length=100)
    
    # Configuración fiscal
    tipo_irpf_default = models.IntegerField(default=7, help_text="% IRPF por defecto")
    regimen_iva = models.CharField(
        max_length=20,
        choices=[
            ('general', 'Régimen General'),
            ('simplificado', 'Régimen Simplificado'),
            ('recargo', 'Recargo de Equivalencia'),
        ],
        default='general'
    )
    
    # Metadata
    fecha_alta = models.DateField(auto_now_add=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Perfil de Autónomo'
        verbose_name_plural = 'Perfiles de Autónomos'
    
    def __str__(self):
        return f"{self.nombre_fiscal} ({self.nif})"


# No necesitamos cambiar ResumenTrimestral porque se calcula dinámicamente

class ResumenTrimestral(models.Model):
    """Modelo calculado para el resumen trimestral"""
    trimestre = models.IntegerField(
        choices=[
            (1, 'Q1 - Primer Trimestre'),
            (2, 'Q2 - Segundo Trimestre'),
            (3, 'Q3 - Tercer Trimestre'),
            (4, 'Q4 - Cuarto Trimestre'),
        ]
    )
    año = models.IntegerField(default=2025)
    
    # Estos campos se calculan automáticamente
    ingresos_totales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gastos_totales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    beneficio_neto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva_repercutido = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva_soportado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva_a_pagar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    irpf_retenido = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ['trimestre', 'año']
        ordering = ['-año', '-trimestre']
        verbose_name = 'Resumen Trimestral'
        verbose_name_plural = 'Resúmenes Trimestrales'
    
    def __str__(self):
        return f"Q{self.trimestre} {self.año}"