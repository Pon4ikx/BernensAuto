from django.contrib import admin

from .models import CarApplication, MotoApplication, OnlineCarEvaluation, OnlineCarEvaluationPhoto


class OnlineCarEvaluationPhotoInline(admin.TabularInline):
    model = OnlineCarEvaluationPhoto
    extra = 0
    fields = ("photo", "created_at")
    readonly_fields = ("created_at",)


class ApplicationAdminMixin:
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"

    @admin.display(description="Имя")
    def display_name_col(self, obj):
        return obj.display_name

    @admin.display(description="Телефон")
    def display_phone_col(self, obj):
        if obj.phone:
            return obj.phone
        if obj.user_id and obj.user.phone:
            return obj.user.phone
        return "—"

    @admin.display(description="Email")
    def display_email_col(self, obj):
        if obj.email:
            return obj.email
        if obj.user_id and obj.user.email:
            return obj.user.email
        return "—"


@admin.register(CarApplication)
class CarApplicationAdmin(ApplicationAdminMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "display_name_col",
        "display_phone_col",
        "application_type",
        "status",
        "car",
        "created_at",
    )
    list_filter = ("application_type", "status", "created_at")
    search_fields = (
        "user__username",
        "user__email",
        "user__phone",
        "name",
        "phone",
        "email",
        "message",
        "car__marka",
        "car__car_model",
    )
    raw_id_fields = ("user", "car")
    fieldsets = (
        (None, {"fields": ("user", "car", "application_type", "status")}),
        ("Контакты (если отличаются от профиля)", {"fields": ("name", "phone", "email")}),
        ("Сообщение", {"fields": ("message",)}),
        ("Даты", {"fields": ("created_at",)}),
    )


@admin.register(MotoApplication)
class MotoApplicationAdmin(ApplicationAdminMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "display_name_col",
        "display_phone_col",
        "application_type",
        "status",
        "motorcycle",
        "created_at",
    )
    list_filter = ("application_type", "status", "created_at")
    search_fields = (
        "user__username",
        "user__email",
        "user__phone",
        "name",
        "phone",
        "email",
        "message",
        "motorcycle__marka",
        "motorcycle__moto_model",
    )
    raw_id_fields = ("user", "motorcycle")
    fieldsets = (
        (None, {"fields": ("user", "motorcycle", "application_type", "status")}),
        ("Контакты (если отличаются от профиля)", {"fields": ("name", "phone", "email")}),
        ("Сообщение", {"fields": ("message",)}),
        ("Даты", {"fields": ("created_at",)}),
    )


@admin.register(OnlineCarEvaluation)
class OnlineCarEvaluationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "marka",
        "car_model",
        "year",
        "transmission",
        "condition",
        "status",
        "created_at",
    )
    list_filter = ("status", "transmission", "created_at")
    search_fields = ("user__username", "marka", "car_model", "body_type", "comments")
    raw_id_fields = ("user",)
    readonly_fields = ("created_at",)
    inlines = [OnlineCarEvaluationPhotoInline]
    fieldsets = (
        (None, {"fields": ("user", "status")}),
        (
            "Автомобиль",
            {"fields": ("marka", "car_model", "body_type", "year", "engine_volume", "transmission", "condition")},
        ),
        ("Комментарии", {"fields": ("comments",)}),
        ("Даты", {"fields": ("created_at",)}),
    )


@admin.register(OnlineCarEvaluationPhoto)
class OnlineCarEvaluationPhotoAdmin(admin.ModelAdmin):
    list_display = ("id", "evaluation", "photo", "created_at")
    list_filter = ("created_at",)
    raw_id_fields = ("evaluation",)
    readonly_fields = ("created_at",)
