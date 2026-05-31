from rest_framework import mixins, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CarApplication, MotoApplication, OnlineCarEvaluation, OnlineCarEvaluationPhoto
from .serializers import (
    CarApplicationCreateSerializer,
    CarApplicationSerializer,
    MotoApplicationCreateSerializer,
    MotoApplicationSerializer,
    OnlineCarEvaluationCreateSerializer,
    OnlineCarEvaluationSerializer,
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


class OnlineCarEvaluationViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return (
            OnlineCarEvaluation.objects.filter(user=self.request.user)
            .prefetch_related("photos")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return OnlineCarEvaluationCreateSerializer
        return OnlineCarEvaluationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evaluation = serializer.save()

        for uploaded in request.FILES.getlist("photos"):
            OnlineCarEvaluationPhoto.objects.create(evaluation=evaluation, photo=uploaded)

        output = OnlineCarEvaluationSerializer(evaluation, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)
