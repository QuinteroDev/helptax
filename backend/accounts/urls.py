# backend/accounts/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngresoViewSet, GastoViewSet, ResumenTrimestralViewSet
from .auth_views import CurrentUserView, PerfilAutonomoView, check_auth, check_nif

router = DefaultRouter()
router.register(r'ingresos', IngresoViewSet, basename='ingreso')
router.register(r'gastos', GastoViewSet, basename='gasto')
router.register(r'resumen', ResumenTrimestralViewSet, basename='resumen')

urlpatterns = [
    path('', include(router.urls)),
    path('user/me/', CurrentUserView.as_view(), name='current-user'),
    path('user/perfil/', PerfilAutonomoView.as_view(), name='perfil-autonomo'),
    path('check-auth/', check_auth, name='check-auth'),
    path('check-nif/', check_nif, name='check-nif'),
]