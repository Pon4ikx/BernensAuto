from django.conf import settings
from django.db import models

from cars.models import Car, Motorcycle


APPLICATION_TYPE_CHOICES = [
    ("обратный_звонок", "Обратный звонок"),
    ("консультация", "Консультация"),
    ("трейд-ин", "Trade-in"),
    ("покупка", "Покупка"),
]

APPLICATION_STATUS_CHOICES = [
    ("новая", "Новая"),
    ("в_работе", "В работе"),
    ("ожидает_клиента", "Ожидает ответа клиента"),
    ("выполнена", "Выполнена"),
    ("отменена", "Отменена"),
]


class CarApplication(models.Model):
    """Заявки на автомобили."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="car_applications",
        verbose_name="Пользователь",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=150, blank=True, verbose_name="Имя")
    phone = models.CharField(max_length=50, blank=True, verbose_name="Телефон")
    email = models.EmailField(blank=True, verbose_name="Email")
    application_type = models.CharField(
        max_length=50, verbose_name="Тип заявки", choices=APPLICATION_TYPE_CHOICES
    )
    status = models.CharField(
        max_length=30,
        choices=APPLICATION_STATUS_CHOICES,
        default="новая",
        verbose_name="Статус",
    )
    message = models.TextField(blank=True, verbose_name="Сообщение")
    car = models.ForeignKey(
        Car,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="car_applications",
        verbose_name="Автомобиль",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        db_table = "evaluations_car_application"
        verbose_name = "Заявка на автомобиль"
        verbose_name_plural = "Заявки на автомобили"
        ordering = ["-created_at"]

    def __str__(self):
        who = self.display_name
        return f"{who} — {self.get_application_type_display()} ({self.created_at.date()})"

    @property
    def display_name(self):
        if self.name:
            return self.name
        if self.user_id:
            return self.user.get_full_name() or self.user.username
        return "Без имени"


class MotoApplication(models.Model):
    """Заявки на мототехнику."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="moto_applications",
        verbose_name="Пользователь",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=150, blank=True, verbose_name="Имя")
    phone = models.CharField(max_length=50, blank=True, verbose_name="Телефон")
    email = models.EmailField(blank=True, verbose_name="Email")
    application_type = models.CharField(
        max_length=50, verbose_name="Тип заявки", choices=APPLICATION_TYPE_CHOICES
    )
    status = models.CharField(
        max_length=30,
        choices=APPLICATION_STATUS_CHOICES,
        default="новая",
        verbose_name="Статус",
    )
    message = models.TextField(blank=True, verbose_name="Сообщение")
    motorcycle = models.ForeignKey(
        Motorcycle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="moto_applications",
        verbose_name="Мототехника",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        db_table = "evaluations_moto_application"
        verbose_name = "Заявка на мототехнику"
        verbose_name_plural = "Заявки на мототехнику"
        ordering = ["-created_at"]

    def __str__(self):
        who = self.display_name
        return f"{who} — {self.get_application_type_display()} ({self.created_at.date()})"

    @property
    def display_name(self):
        if self.name:
            return self.name
        if self.user_id:
            return self.user.get_full_name() or self.user.username
        return "Без имени"
