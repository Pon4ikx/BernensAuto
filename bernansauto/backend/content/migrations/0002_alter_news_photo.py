from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="news",
            name="photo",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="news/photos/",
                verbose_name="Фото",
            ),
        ),
    ]
