# backend/create_test_data.py

from django.contrib.auth.models import User
from accounts.models import PerfilAutonomo, Ingreso, Gasto
from datetime import date, timedelta
import random

def create_test_data():
    # Crear usuario de prueba
    user, created = User.objects.get_or_create(
        username='ivan@ejemplo.com',
        defaults={
            'email': 'ivan@ejemplo.com',
            'first_name': 'Iván',
            'last_name': 'Ruiz'
        }
    )
    
    if created:
        user.set_password('123456')
        user.save()
        print("✅ Usuario creado: ivan@ejemplo.com / password: 123456")
    
    # Crear perfil de autónomo
    perfil, created = PerfilAutonomo.objects.get_or_create(
        usuario=user,
        defaults={
            'nombre_fiscal': 'Iván Ruiz Quintero',
            'nif': '12345678A',
            'direccion': 'Calle Principal 123',
            'codigo_postal': '29001',
            'ciudad': 'Málaga',
            'provincia': 'Málaga',
            'tipo_irpf_default': 7,
            'regimen_iva': 'general'
        }
    )
    
    if created:
        print("✅ Perfil de autónomo creado")
    
    # Datos de ejemplo para ingresos y gastos
    clientes = [
        ('Urodata SaaS', 'Desarrollo plataforma médica'),
        ('Refluxion App', 'Aplicación móvil salud'),
        ('Ware26 Tech', 'Sistema reconocimiento facial'),
        ('Startup XYZ', 'Consultoría técnica'),
        ('Empresa ABC', 'Desarrollo web corporativa')
    ]
    
    proveedores = [
        ('Amazon Web Services', 'Hosting y servicios cloud'),
        ('Google Workspace', 'Suite ofimática'),
        ('Adobe Creative', 'Licencia software diseño'),
        ('Coworking Málaga', 'Alquiler espacio trabajo'),
        ('Material Oficina SL', 'Material oficina'),
        ('Formación Online', 'Curso React avanzado'),
        ('Vodafone', 'Internet fibra + móvil')
    ]
    
    # Crear ingresos para Q3 y Q4 2024, Q1 2025
    trimestres = [
        (3, 2024, date(2024, 7, 1)),
        (4, 2024, date(2024, 10, 1)),
        (1, 2025, date(2025, 1, 1))
    ]
    
    print("\n📊 Creando ingresos...")
    for trimestre, año, fecha_base in trimestres:
        # 3-5 facturas por trimestre
        num_facturas = random.randint(3, 5)
        for i in range(num_facturas):
            cliente, descripcion = random.choice(clientes)
            fecha = fecha_base + timedelta(days=random.randint(0, 89))
            importe = round(random.uniform(1500, 8000), 2)
            
            Ingreso.objects.create(
                usuario=user,
                fecha=fecha,
                descripcion=f"{descripcion} - Fase {i+1}",
                cliente=cliente,
                importe=importe,
                iva_porcentaje=21,
                irpf_porcentaje=7,
                trimestre=trimestre,
                año=año
            )
        
        print(f"  ✅ Q{trimestre}/{año}: {num_facturas} facturas creadas")
    
    print("\n💸 Creando gastos...")
    for trimestre, año, fecha_base in trimestres:
        # 4-7 gastos por trimestre
        num_gastos = random.randint(4, 7)
        for i in range(num_gastos):
            proveedor, descripcion = random.choice(proveedores)
            fecha = fecha_base + timedelta(days=random.randint(0, 89))
            importe = round(random.uniform(50, 800), 2)
            
            # Algunos gastos sin IVA (formación, seguros)
            iva = 21 if random.random() > 0.2 else 0
            
            Gasto.objects.create(
                usuario=user,
                fecha=fecha,
                descripcion=descripcion,
                proveedor=proveedor,
                importe=importe,
                iva_porcentaje=iva,
                trimestre=trimestre,
                año=año
            )
        
        print(f"  ✅ Q{trimestre}/{año}: {num_gastos} gastos creados")
    
    # Mostrar resumen
    total_ingresos = Ingreso.objects.filter(usuario=user).count()
    total_gastos = Gasto.objects.filter(usuario=user).count()
    
    print(f"\n✨ Datos de prueba creados exitosamente:")
    print(f"   - Usuario: ivan@ejemplo.com / 123456")
    print(f"   - Total ingresos: {total_ingresos}")
    print(f"   - Total gastos: {total_gastos}")
    print(f"\n🚀 Ya puedes iniciar sesión y ver los datos en la app")

if __name__ == '__main__':
    import django
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'helptax.settings')
    django.setup()
    
    create_test_data()