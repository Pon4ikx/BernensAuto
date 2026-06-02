import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("evaluations", "0002_split_application_into_car_and_moto"),
    ]

    operations = [
        migrations.AddField(
            model_name="carapplication",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="car_applications",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Пользователь",
            ),
        ),
        migrations.AddField(
            model_name="motoapplication",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="moto_applications",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Пользователь",
            ),
        ),
        migrations.AlterField(
            model_name="carapplication",
            name="name",
            field=models.CharField(blank=True, max_length=150, verbose_name="Имя"),
        ),
        migrations.AlterField(
            model_name="carapplication",
            name="phone",
            field=models.CharField(blank=True, max_length=50, verbose_name="Телефон"),
        ),
        migrations.AlterField(
            model_name="motoapplication",
            name="name",
            field=models.CharField(blank=True, max_length=150, verbose_name="Имя"),
        ),
        migrations.AlterField(
            model_name="motoapplication",
            name="phone",
            field=models.CharField(blank=True, max_length=50, verbose_name="Телефон"),
        ),
    ]
