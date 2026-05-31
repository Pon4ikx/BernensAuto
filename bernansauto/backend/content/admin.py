from django.contrib import admin
from django.utils.html import format_html

from .forms import NewsAdminForm
from .models import Contact, News


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("id", "address", "phone", "email", "work_hours")
    search_fields = ("address", "phone", "email")


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    form = NewsAdminForm
    list_display = ("id", "title", "photo_thumb", "published_at")
    list_filter = ("published_at",)
    search_fields = ("title", "text")
    date_hierarchy = "published_at"
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
            return [
                (None, {"fields": ("title", "text", "photo_thumb", "photo", "published_at")}),
            ]
        return [(None, {"fields": ("title", "text", "photo", "published_at")})]
