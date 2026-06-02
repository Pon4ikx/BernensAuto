import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("evaluations", "0004_application_status_and_type_cleanup"),
    ]

    operations = [
        migrations.CreateModel(
            name="OnlineCarEvaluation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("marka", models.CharField(max_length=100, verbose_name="Марка")),
                ("car_model", models.CharField(max_length=100, verbose_name="Модель")),
                ("body_type", models.CharField(max_length=50, verbose_name="Кузов")),
                ("year", models.PositiveIntegerField(verbose_name="Год выпуска")),
                (
                    "engine_volume",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=6,
                        null=True,
                        verbose_name="Объём двигателя (л)",
                    ),
                ),
                (
                    "transmission",
                    models.CharField(
                        choices=[("автомат", "Автомат"), ("механика", "Механика")],
                        max_length=20,
                        verbose_name="Коробка передач",
                    ),
                ),
                (
                    "condition",
                    models.PositiveSmallIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(10),
                        ],
                        verbose_name="Состояние (из 10)",
                    ),
                ),
                ("comments", models.TextField(blank=True, verbose_name="Комментарии / нюансы")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("новая", "Новая"),
                            ("в_работе", "В работе"),
                            ("ожидает_клиента", "Ожидает ответа клиента"),
                            ("выполнена", "Выполнена"),
                            ("отменена", "Отменена"),
                        ],
                        default="новая",
                        max_length=30,
                        verbose_name="Статус",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="online_car_evaluations",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Пользователь",
                    ),
                ),
            ],
            options={
                "verbose_name": "Онлайн-оценка авто",
                "verbose_name_plural": "Онлайн-оценки авто",
                "db_table": "evaluations_online_car_evaluation",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="OnlineCarEvaluationPhoto",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("photo", models.ImageField(upload_to="evaluations/online_photos/", verbose_name="Фото")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Дата загрузки")),
                (
                    "evaluation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="photos",
                        to="evaluations.onlinecarevaluation",
                        verbose_name="Оценка",
                    ),
                ),
            ],
            options={
                "verbose_name": "Фото онлайн-оценки",
                "verbose_name_plural": "Фото онлайн-оценок",
                "db_table": "evaluations_online_car_evaluation_photo",
                "ordering": ["id"],
            },
        ),
    ]
