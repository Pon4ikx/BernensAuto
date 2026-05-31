from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import CarApplication, MotoApplication
from .serializers import (
    CarApplicationCreateSerializer,
    CarApplicationSerializer,
    MotoApplicationCreateSerializer,
    MotoApplicationSerializer,
)


class CarApplicationViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            CarApplication.objects.filter(user=self.request.user)
            .select_related("car", "user")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return CarApplicationCreateSerializer
        return CarApplicationSerializer

    def perform_create(self, serializer):
        serializer.save()


class MotoApplicationViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            MotoApplication.objects.filter(user=self.request.user)
            .select_related("motorcycle", "user")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return MotoApplicationCreateSerializer
        return MotoApplicationSerializer

    def perform_create(self, serializer):
        serializer.save()
