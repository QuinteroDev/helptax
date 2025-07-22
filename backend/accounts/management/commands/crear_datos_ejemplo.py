# backend/accounts/management/commands/crear_datos_ejemplo.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import random

from accounts.models import Ingreso, Gasto


class Command(BaseCommand):
    help = 'Crea datos de ejemplo para Q3 2025'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creando datos de ejemplo para Q3 2025...')
        
        # Limpiar datos existentes del Q3 2025
        Ingreso.objects.filter(trimestre=3, año=2025).delete()
        Gasto.objects.filter(trimestre=3, año=2025).delete()
        
        # Datos de ejemplo basados en tu Excel
        ingresos_data = [
            {
                'fecha': date(2025, 7, 1),
                'descripcion': 'Demo IA',
                'cliente': 'Urodata',
                'importe': Decimal('500.00'),
                'iva_porcentaje': 0,
                'irpf_porcentaje': 0,
            },
            {
                'fecha': date(2025, 7, 7),
                'descripcion': 'Kidsy MVP 1 fase',
                'cliente': 'Ware26',
                'importe': Decimal('1750.00'),
                'iva_porcentaje': 21,
                'irpf_porcentaje': 7,
            },
            {
                'fecha': date(2025, 7, 9),
                'descripcion': 'Desarrollo 1 Hito MVP',
                'cliente': 'Ontrackia',
                'importe': Decimal('1000.00'),
                'iva_porcentaje': 21,
                'irpf_porcentaje': 0,
            },
        ]
        
        gastos_data = [
            {
                'fecha': date(2025, 7, 1),
                'descripcion': 'Servidor',
                'proveedor': 'Digital Ocean',
                'importe': Decimal('38.98'),
                'iva_porcentaje': 0,
            },
            {
                'fecha': date(2025, 7, 4),
                'descripcion': 'Línea de Internet',
                'proveedor': 'Movistar',
                'importe': Decimal('41.40'),
                'iva_porcentaje': 21,
            },
            {
                'fecha': date(2025, 7, 5),
                'descripcion': 'Claude AI',
                'proveedor': 'Anthropic',
                'importe': Decimal('179.90'),
                'iva_porcentaje': 0,
            },
            {
                'fecha': date(2025, 7, 7),
                'descripcion': 'Gastos Malt Kidsy 1 Fase',
                'proveedor': 'Malt',
                'importe': Decimal('175.00'),
                'iva_porcentaje': 0,
            },
            {
                'fecha': date(2025, 7, 14),
                'descripcion': 'Almacenamiento',
                'proveedor': 'Apple',
                'importe': Decimal('0.82'),
                'iva_porcentaje': 21,
            },
            {
                'fecha': date(2025, 7, 17),
                'descripcion': 'Almacenamiento Google',
                'proveedor': 'Google',
                'importe': Decimal('1.64'),
                'iva_porcentaje': 21,
            },
            {
                'fecha': date(2025, 7, 19),
                'descripcion': 'Renovación Dominio quinterodev.com',
                'proveedor': 'GoDaddy',
                'importe': Decimal('22.16'),
                'iva_porcentaje': 0,
            },
        ]
        
        # Crear ingresos
        for ingreso_data in ingresos_data:
            ingreso = Ingreso.objects.create(
                **ingreso_data,
                trimestre=3,
                año=2025
            )
            self.stdout.write(f'✓ Ingreso creado: {ingreso}')
        
        # Crear gastos
        for gasto_data in gastos_data:
            gasto = Gasto.objects.create(
                **gasto_data,
                trimestre=3,
                año=2025
            )
            self.stdout.write(f'✓ Gasto creado: {gasto}')
        
        # Mostrar resumen
        total_ingresos = sum(i['importe'] for i in ingresos_data)
        total_gastos = sum(g['importe'] for g in gastos_data)
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✨ Datos creados exitosamente!\n'
            f'Total ingresos: {total_ingresos:.2f} €\n'
            f'Total gastos: {total_gastos:.2f} €\n'
            f'Beneficio neto: {total_ingresos - total_gastos:.2f} €'
        ))