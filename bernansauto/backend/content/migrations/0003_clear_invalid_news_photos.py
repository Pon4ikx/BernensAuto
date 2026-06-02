from django.db import migrations


def clear_legacy_photo_paths(apps, schema_editor):
    News = apps.get_model("content", "News")
    for news in News.objects.exclude(photo="").iterator():
        name = str(news.photo or "")
        if name.startswith("/") or name.startswith("static/"):
            news.photo = ""
            news.save(update_fields=["photo"])


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0002_alter_news_photo"),
    ]

    operations = [
        migrations.RunPython(clear_legacy_photo_paths, migrations.RunPython.noop),
    ]
