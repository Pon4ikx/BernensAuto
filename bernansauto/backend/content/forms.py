from django import forms

from .models import News


class NewsAdminForm(forms.ModelForm):
    class Meta:
        model = News
        fields = ("title", "text", "photo", "published_at")
        widgets = {
            "photo": forms.ClearableFileInput(attrs={"accept": "image/*"}),
        }
