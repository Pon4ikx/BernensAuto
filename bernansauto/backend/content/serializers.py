from rest_framework import serializers

from .models import Contact, News


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ('id', 'address', 'phone', 'email', 'work_hours', 'map_link')


class NewsSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = ('id', 'title', 'text', 'photo', 'published_at')

    def get_photo(self, obj):
        if not obj.photo:
            return None
        name = getattr(obj.photo, 'name', '') or ''
        if not name or not obj.photo.storage.exists(name):
            return None
        url = obj.photo.url
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        if url and not url.startswith(('http://', 'https://')):
            return url if url.startswith('/') else f'/{url}'
        return url

