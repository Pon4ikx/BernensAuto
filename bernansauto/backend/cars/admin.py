from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html
from .models import Car, Motorcycle, Car_Photo, Moto_Photo, CarFavorite, MotoFavorite



def _photo_inline_preview(obj):
    if obj.pk and obj.photo:
        return format_html(
            '<img src="{}" style="max-height: 80px; max-width: 120px; object-fit: contain; display: block; margin-bottom: 6px;" />'
            '<span style="font-size: 12px; word-break: break-all;">{}</span>',
            obj.photo.url,
            obj.photo.name,
        )
    return "—"


class PhotoInlineBulkMixin:
    class Media:
        js = ("admin/js/photo_bulk_upload.js",)


class Car_PhotoInline(PhotoInlineBulkMixin, admin.TabularInline):
    model = Car_Photo
    extra = 0
    fields = ("photo_preview", "photo")
    readonly_fields = ("photo_preview",)

    @admin.display(description="Превью")
    def photo_preview(self, obj):
        return _photo_inline_preview(obj)


class Moto_PhotoInline(PhotoInlineBulkMixin, admin.TabularInline):
    model = Moto_Photo
    extra = 0
    fields = ("photo_preview", "photo")
    readonly_fields = ("photo_preview",)

    @admin.display(description="Превью")
    def photo_preview(self, obj):
        return _photo_inline_preview(obj)


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = (
        "marka",
        "car_model",
        "year",
        "mileage",
        "engine_volume",
        "color",
        "price_byn",
        "price_usd",
        "available",
        "created_at",
    )
    list_filter = ("available", "marka", "year")
    search_fields = ("marka", "car_model", "description")
    list_editable = ("available",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [Car_PhotoInline]
    fieldsets = (
        (None, {"fields": ("marka", "car_model", "year", "mileage", "color", "description", "available")}),
        ("Двигатель и ходовая", {"fields": ("body_type", "engine_type", "engine_volume", "transmission", "drive_type")}),
        ("Цены", {"fields": ("price_byn", "price_usd")}),
        ("Даты", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Motorcycle)
class MotorcycleAdmin(admin.ModelAdmin):
    list_display = (
        "marka",
        "moto_model",
        "year",
        "mileage",
        "transmission",
        "engine_type",
        "engine_volume",
        "moto_type",
        "price_byn",
        "price_usd",
        "available",
        "created_at",
    )
    list_filter = ("available", "marka", "year", "moto_type")
    search_fields = ("marka", "moto_model", "description")
    list_editable = ("available",)
    readonly_fields = ("created_at",)
    inlines = [Moto_PhotoInline]
    fieldsets = (
        (None, {"fields": ("marka", "moto_model", "year", "mileage", "transmission", "engine_type", "engine_volume", "moto_type", "description", "available")}),
        ("Цены", {"fields": ("price_byn", "price_usd")}),
        ("Даты", {"fields": ("created_at",)}),
    )


@admin.register(Car_Photo)
class Car_PhotoAdmin(admin.ModelAdmin):
    list_display = ("car", "photo_thumb", "photo")
    list_filter = ("car",)
    search_fields = ("car__marka", "car__car_model")
    raw_id_fields = ("car",)
    readonly_fields = ("photo_thumb",)

    def photo_thumb(self, obj):
        if obj.pk and obj.photo:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 150px; object-fit: contain;" />',
                obj.photo.url,
            )
        return "—"
    photo_thumb.short_description = "Превью"

    def get_fieldsets(self, request, obj=None):
        if obj and obj.photo:
            return [(None, {"fields": ("car", "photo_thumb", "photo")})]
        return [(None, {"fields": ("car", "photo")})]

    def get_changeform_initial_data(self, request):
        """
        Если в querystring передан ?car=<id>, подставляем этот автомобиль по умолчанию.
        Это нужно, чтобы при добавлении нескольких фотографий подряд не приходилось
        каждый раз заново выбирать машину.
        """
        initial = super().get_changeform_initial_data(request)
        car_id = request.GET.get("car")
        if car_id:
            initial["car"] = car_id
        return initial

    def response_add(self, request, obj, post_url_continue=None):
        """
        При нажатии «Сохранить и добавить ещё» остаёмся в форме добавления фото
        с тем же самым автомобилем, который только что выбрали.
        """
        if "_addanother" in request.POST:
            opts = self.model._meta
            add_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_add")
            return HttpResponseRedirect(f"{add_url}?car={obj.car_id}")
        return super().response_add(request, obj, post_url_continue)


@admin.register(Moto_Photo)
class Moto_PhotoAdmin(admin.ModelAdmin):
    list_display = ( "motorcycle", "photo_thumb", "photo")
    list_filter = ("motorcycle",)
    search_fields = ("motorcycle__marka", "motorcycle__moto_model")
    raw_id_fields = ("motorcycle",)
    readonly_fields = ("photo_thumb",)

    def photo_thumb(self, obj):
        if obj.pk and obj.photo:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 150px; object-fit: contain;" />',
                obj.photo.url,
            )
        return "—"
    photo_thumb.short_description = "Превью"

    def get_fieldsets(self, request, obj=None):
        if obj and obj.photo:
            return [(None, {"fields": ("motorcycle", "photo_thumb", "photo")})]
        return [(None, {"fields": ("motorcycle", "photo")})]

    def get_changeform_initial_data(self, request):
        """
        Аналогично Car_PhotoAdmin: подставляем выбранную мототехнику из ?motorcycle=<id>.
        """
        initial = super().get_changeform_initial_data(request)
        moto_id = request.GET.get("motorcycle")
        if moto_id:
            initial["motorcycle"] = moto_id
        return initial

    def response_add(self, request, obj, post_url_continue=None):
        """
        «Сохранить и добавить ещё» оставляет выбранную мототехнику.
        """
        if "_addanother" in request.POST:
            opts = self.model._meta
            add_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_add")
            return HttpResponseRedirect(f"{add_url}?motorcycle={obj.motorcycle_id}")
        return super().response_add(request, obj, post_url_continue)


@admin.register(CarFavorite)
class CarFavoriteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "car", "created_at")
    list_filter = ("user",)
    search_fields = ("user__username", "car__marka")
    raw_id_fields = ("user", "car")
    readonly_fields = ("created_at",)


@admin.register(MotoFavorite)
class MotoFavoriteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "motorcycle", "created_at")
    list_filter = ("user",)
    search_fields = ("user__username", "motorcycle__marka")
    raw_id_fields = ("user", "motorcycle")
    readonly_fields = ("created_at",)
