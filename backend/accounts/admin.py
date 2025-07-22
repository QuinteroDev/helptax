# backend/accounts/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Q
from django.urls import reverse
from django.utils.safestring import mark_safe
from decimal import Decimal
import datetime

from .models import Ingreso, Gasto, ResumenTrimestral


@admin.register(Ingreso)
class IngresoAdmin(admin.ModelAdmin):
    """Admin personalizado para Ingresos"""
    list_display = [
        'fecha', 'cliente', 'descripcion', 'importe_formateado', 
        'iva_tag', 'irpf_tag', 'total_formateado', 'trimestre_año'
    ]
    list_filter = ['trimestre', 'año', 'iva_porcentaje', 'cliente']
    search_fields = ['cliente', 'descripcion']
    date_hierarchy = 'fecha'
    ordering = ['-fecha']
    
    fieldsets = (
        ('Información básica', {
            'fields': ('fecha', 'cliente', 'descripcion')
        }),
        ('Importes', {
            'fields': ('importe', 'iva_porcentaje', 'irpf_porcentaje')
        }),
        ('Periodo', {
            'fields': ('trimestre', 'año')
        }),
    )
    
    def importe_formateado(self, obj):
        return format_html('<strong>{:.2f} €</strong>', obj.importe)
    importe_formateado.short_description = 'Importe'
    importe_formateado.admin_order_field = 'importe'
    
    def iva_tag(self, obj):
        if obj.iva_porcentaje == 0:
            return format_html('<span style="color: gray;">Sin IVA</span>')
        return format_html(
            '<span style="color: blue;">{:.2f} € ({}%)</span>', 
            obj.iva_importe, obj.iva_porcentaje
        )
    iva_tag.short_description = 'IVA'
    
    def irpf_tag(self, obj):
        if obj.irpf_porcentaje == 0:
            return format_html('<span style="color: gray;">Sin IRPF</span>')
        return format_html(
            '<span style="color: orange;">{:.2f} € ({}%)</span>', 
            obj.irpf_importe, obj.irpf_porcentaje
        )
    irpf_tag.short_description = 'IRPF'
    
    def total_formateado(self, obj):
        return format_html('<strong style="color: green;">{:.2f} €</strong>', obj.total)
    total_formateado.short_description = 'Total c/IVA'
    
    def trimestre_año(self, obj):
        return f"Q{obj.trimestre} {obj.año}"
    trimestre_año.short_description = 'Periodo'
    trimestre_año.admin_order_field = 'trimestre'


@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    """Admin personalizado para Gastos"""
    list_display = [
        'fecha', 'proveedor', 'descripcion', 'importe_formateado', 
        'iva_tag', 'total_formateado', 'tiene_factura', 'trimestre_año'
    ]
    list_filter = ['trimestre', 'año', 'iva_porcentaje', 'proveedor']
    search_fields = ['proveedor', 'descripcion']
    date_hierarchy = 'fecha'
    ordering = ['-fecha']
    
    fieldsets = (
        ('Información básica', {
            'fields': ('fecha', 'proveedor', 'descripcion')
        }),
        ('Importes', {
            'fields': ('importe', 'iva_porcentaje')
        }),
        ('Documentación', {
            'fields': ('factura',),
            'description': 'Adjunte la factura en formato PDF'
        }),
        ('Periodo', {
            'fields': ('trimestre', 'año')
        }),
    )
    
    def importe_formateado(self, obj):
        return format_html('<strong>{:.2f} €</strong>', obj.importe)
    importe_formateado.short_description = 'Importe'
    importe_formateado.admin_order_field = 'importe'
    
    def iva_tag(self, obj):
        if obj.iva_porcentaje == 0:
            return format_html('<span style="color: gray;">Sin IVA</span>')
        return format_html(
            '<span style="color: blue;">{:.2f} € ({}%)</span>', 
            obj.iva_importe, obj.iva_porcentaje
        )
    iva_tag.short_description = 'IVA'
    
    def total_formateado(self, obj):
        return format_html('<strong style="color: red;">{:.2f} €</strong>', obj.total)
    total_formateado.short_description = 'Total c/IVA'
    
    def tiene_factura(self, obj):
        if obj.factura:
            return format_html(
                '<a href="{}" target="_blank">📄 Ver factura</a>',
                obj.factura.url
            )
        return format_html('<span style="color: red;">⚠️ Sin factura</span>')
    tiene_factura.short_description = 'Factura'
    
    def trimestre_año(self, obj):
        return f"Q{obj.trimestre} {obj.año}"
    trimestre_año.short_description = 'Periodo'
    trimestre_año.admin_order_field = 'trimestre'


@admin.register(ResumenTrimestral)
class ResumenTrimestralAdmin(admin.ModelAdmin):
    """Admin personalizado para Resúmenes Trimestrales"""
    list_display = [
        'periodo', 'ingresos_tag', 'gastos_tag', 'beneficio_tag', 
        'iva_tag', 'irpf_tag'
    ]
    list_filter = ['año', 'trimestre']
    ordering = ['-año', '-trimestre']
    
    def periodo(self, obj):
        return format_html('<strong>Q{} {}</strong>', obj.trimestre, obj.año)
    periodo.short_description = 'Periodo'
    
    def ingresos_tag(self, obj):
        return format_html(
            '<span style="color: green; font-size: 1.1em;">{:.2f} €</span>', 
            obj.ingresos_totales
        )
    ingresos_tag.short_description = 'Ingresos'
    
    def gastos_tag(self, obj):
        return format_html(
            '<span style="color: red; font-size: 1.1em;">{:.2f} €</span>', 
            obj.gastos_totales
        )
    gastos_tag.short_description = 'Gastos'
    
    def beneficio_tag(self, obj):
        color = 'green' if obj.beneficio_neto > 0 else 'red'
        return format_html(
            '<strong style="color: {}; font-size: 1.2em;">{:.2f} €</strong>', 
            color, obj.beneficio_neto
        )
    beneficio_tag.short_description = 'Beneficio Neto'
    
    def iva_tag(self, obj):
        return format_html(
            'A pagar: <strong>{:.2f} €</strong><br>'
            '<small>Rep: {:.2f} € | Sop: {:.2f} €</small>',
            obj.iva_a_pagar, obj.iva_repercutido, obj.iva_soportado
        )
    iva_tag.short_description = 'IVA'
    
    def irpf_tag(self, obj):
        return format_html(
            '<strong style="color: orange;">{:.2f} €</strong>', 
            obj.irpf_retenido
        )
    irpf_tag.short_description = 'IRPF a ingresar'
    
    def has_add_permission(self, request):
        # Los resúmenes se calculan automáticamente
        return False
    
    def has_change_permission(self, request, obj=None):
        # No permitir editar los resúmenes
        return False


# Personalizar el título del admin
admin.site.site_header = "HelpTax Admin - Gestión Trimestral"
admin.site.site_title = "HelpTax"
admin.site.index_title = "Panel de Control"


# Agregar acciones personalizadas
@admin.action(description='Duplicar registros seleccionados')
def duplicar_registros(modeladmin, request, queryset):
    for obj in queryset:
        obj.pk = None  # Eliminar la clave primaria para crear nuevo registro
        obj.save()
    modeladmin.message_user(request, f"{queryset.count()} registros duplicados correctamente.")


# Añadir la acción a los modelos
IngresoAdmin.actions = [duplicar_registros]
GastoAdmin.actions = [duplicar_registros]