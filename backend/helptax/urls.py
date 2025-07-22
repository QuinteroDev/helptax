# backend/helptax/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from dj_rest_auth.views import LogoutView
from accounts.auth_views_custom import custom_register, custom_login

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    # Auth endpoints
    path('api/auth/login/', custom_login, name='rest_login'),
    path('api/auth/logout/', LogoutView.as_view(), name='rest_logout'),
    path('api/auth/registration/', custom_register, name='rest_register'),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)