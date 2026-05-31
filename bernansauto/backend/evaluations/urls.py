from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CarApplicationViewSet, MotoApplicationViewSet

router = DefaultRouter()
router.register(r"car-applications", CarApplicationViewSet, basename="car_application")
router.register(r"moto-applications", MotoApplicationViewSet, basename="moto_application")

urlpatterns = [
    path("", include(router.urls)),
]
