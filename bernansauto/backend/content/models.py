from django.db import models


class Contact(models.Model):
    """Контакты: адрес, телефон, email, время_работы, карта_ссылка."""
    address = models.CharField(max_length=300, blank=True, verbose_name="Адрес")
    phone = models.CharField(max_length=50, blank=True, verbose_name="Телефон")
    email = models.EmailField(blank=True, verbose_name="Email")
    work_hours = models.CharField(max_length=200, blank=True, verbose_name="Время работы")
    map_link = models.CharField(max_length=500, blank=True, verbose_name="Ссылка на карту")

    class Meta:
        db_table = "content_contact"
        verbose_name = "Контакты"
        verbose_name_plural = "Контакты"
        ordering = ["id"]

    def __str__(self):
        return self.phone or self.email or "Контакты"


class News(models.Model):
    """Новости: заголовок, текст, фото, дата публикации."""
    title = models.CharField(max_length=300, verbose_name="Заголовок")
    text = models.TextField(verbose_name="Текст")
    photo = models.ImageField(
        upload_to="news/photos/",
        blank=True,
        null=True,
        verbose_name="Фото",
    )
    published_at = models.DateTimeField(verbose_name="Дата публикации")

    class Meta:
        db_table = "content_news"
        verbose_name = "Новость"
        verbose_name_plural = "Новости"
        ordering = ["-published_at"]

    def __str__(self):
        return self.title
