# HelpTax Backend

API REST para el sistema de gestión fiscal HelpTax, construido con Django y Django REST Framework.

## 🚀 Características

- Autenticación JWT
- API RESTful completa
- Multi-tenant (cada usuario ve solo sus datos)
- Gestión de archivos para facturas
- Cálculos automáticos de IVA e IRPF

## 📋 Requisitos

- Python 3.10+
- pip
- SQLite (desarrollo) / PostgreSQL (producción)

## 🔧 Instalación

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (opcional)
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/registration/` - Registro de nuevo usuario
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout

### Perfil
- `GET /api/user/me/` - Obtener usuario actual
- `GET/PATCH /api/user/perfil/` - Gestionar perfil fiscal

### Ingresos
- `GET /api/ingresos/` - Listar ingresos
- `POST /api/ingresos/` - Crear ingreso
- `GET/PUT/DELETE /api/ingresos/{id}/` - Detalle de ingreso

### Gastos
- `GET /api/gastos/` - Listar gastos
- `POST /api/gastos/` - Crear gasto (con archivo)
- `GET/PUT/DELETE /api/gastos/{id}/` - Detalle de gasto

### Resúmenes
- `GET /api/resumen/calcular/?trimestre=1&año=2025` - Calcular resumen trimestral

## 🏗️ Estructura

```
backend/
├── accounts/          # App principal
│   ├── models.py     # Modelos de datos
│   ├── serializers.py # Serializers DRF
│   ├── views.py      # Vistas y ViewSets
│   └── urls.py       # Rutas de la app
├── helptax/          # Configuración Django
│   ├── settings.py   # Configuración
│   └── urls.py       # URLs principales
└── media/            # Archivos subidos (ignorado en git)
```

## 🔒 Seguridad

- Autenticación JWT con tokens de acceso y refresco
- Permisos por usuario (multi-tenant)
- CORS configurado para el frontend
- Validación de datos en serializers