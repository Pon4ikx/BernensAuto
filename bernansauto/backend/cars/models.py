from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Car(models.Model):
    """Автомобили."""
    marka = models.CharField(max_length=100, verbose_name="Марка", default="")
    car_model = models.CharField(max_length=100, verbose_name="Модель", default="")
    year = models.PositiveIntegerField(verbose_name="Год выпуска", default=2000)
    body_type = models.CharField(max_length=50, blank=True, verbose_name="Тип кузова")
    mileage = models.PositiveIntegerField(verbose_name="Пробег", default=0)
    transmission = models.CharField(max_length=50, blank=True, verbose_name="Коробка передач")
    drive_type = models.CharField(max_length=50, blank=True, verbose_name="Привод")
    engine_type = models.CharField(max_length=50, blank=True, verbose_name="Тип двигателя")
    engine_volume = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="Объём двигателя"
    )
    color = models.CharField(max_length=50, blank=True, verbose_name="Цвет")
    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
        verbose_name="URL-имя",
    )
    
    price_byn = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Цена BYN"
    )
    price_usd = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Цена USD"
    )
    description = models.TextField(blank=True, verbose_name="Описание")
    available = models.BooleanField(default=True, verbose_name="Доступно")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        db_table = "cars_car"
        verbose_name = "Автомобиль"
        verbose_name_plural = "Автомобили"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.marka} {self.car_model} ({self.year})"

    def _generate_slug(self) -> str:
        """
        Формируем человекочитаемый slug вида Марка-Модель-Год с заменой пробелов на дефисы.
        Пример: BMW-X5-2023.
        """
        base = f"{self.marka}-{self.car_model}-{self.year}"
        # сначала грубо заменяем пробелы на дефисы, затем даём slugify донастроить строку
        base = base.replace(" ", "-")
        raw = slugify(base, allow_unicode=True)
        # подстраховка на случай пустого результата
        if not raw:
            raw = f"car-{self.pk or ''}"
        slug = raw
        n = 1
        while Car.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            n += 1
            slug = f"{raw}-{n}"
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)


class Motorcycle(models.Model):
    """Мототехника: марка, модель, год, пробег, объём двигателя, тип (мотоцикл/квадроцикл/скутер), цены, описание, доступно, дата_создания."""
    MOTO_TYPE_CHOICES = [
        ("мотоцикл", "Мотоцикл"),
        ("квадроцикл", "Квадроцикл"),
        ("скутер", "Скутер"),
        ("седан", "Седан"),
    ]
    marka = models.CharField(max_length=100, verbose_name="Марка", default="")
    moto_model = models.CharField(max_length=100, verbose_name="Модель", default="")
    year = models.PositiveIntegerField(verbose_name="Год выпуска", default=2000)
    mileage = models.PositiveIntegerField(verbose_name="Пробег", default=0)
    transmission = models.CharField(max_length=50, blank=True, verbose_name="Привод")
    engine_type = models.CharField(max_length=50, blank=True, verbose_name="Двигатель")

    engine_volume = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Объём двигателя (куб. см.)",
    )
    moto_type = models.CharField(
        max_length=50, blank=True, verbose_name="Тип", choices=MOTO_TYPE_CHOICES
    )
    price_byn = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Цена BYN"
    )
    price_usd = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Цена USD"
    )
    description = models.TextField(blank=True, verbose_name="Описание")
    available = models.BooleanField(default=True, verbose_name="Доступно")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
        verbose_name="URL-имя",
    )

    class Meta:
        db_table = "cars_motorcycle"
        verbose_name = "Мототехника"
        verbose_name_plural = "Мототехника"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.marka} {self.moto_model} ({self.year})"

    def _generate_slug(self) -> str:
        """
        Формируем slug для мототехники: Марка-Модель-Год.
        """
        base = f"{self.marka}-{self.moto_model}-{self.year}"
        base = base.replace(" ", "-")
        raw = slugify(base, allow_unicode=True)
        if not raw:
            raw = f"moto-{self.pk or ''}"
        slug = raw
        n = 1
        while Motorcycle.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            n += 1
            slug = f"{raw}-{n}"
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)


class Car_Photo(models.Model):
    """Фото_авто: авто_id (FK → Автомобили), ссылка_на_фото (строка)."""
    car = models.ForeignKey(
        Car, on_delete=models.CASCADE, related_name="photos", verbose_name="Автомобиль"
    )
    photo = models.ImageField(upload_to='cars/photos/', blank=True, null=True, verbose_name="Фото")

    class Meta:
        db_table = "cars_car_photo"
        verbose_name = "Фото автомобиля"
        verbose_name_plural = "Фото автомобилей"
        ordering = ["id"]

    def __str__(self):
        return f"Фото — {self.car}"


class Moto_Photo(models.Model):
    """Фото_мототехники: мототехника_id (FK → Мототехника), ссылка_на_фото (строка)."""
    motorcycle = models.ForeignKey(
        Motorcycle, on_delete=models.CASCADE, related_name="photos", verbose_name="Мототехника"
    )
    photo = models.ImageField(upload_to='motorcycles/photos/', blank=True, null=True, verbose_name="Фото")

    class Meta:
        db_table = "cars_moto_photo"
        verbose_name = "Фото мототехники"
        verbose_name_plural = "Фото мототехники"
        ordering = ["id"]

    def __str__(self):
        return f"Фото — {self.motorcycle}"


class CarFavorite(models.Model):
    """Избранные автомобили."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="car_favorites",
        verbose_name="Пользователь",
    )
    car = models.ForeignKey(
        Car, on_delete=models.CASCADE, related_name="car_favorites", verbose_name="Автомобиль"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")

    class Meta:
        db_table = "cars_car_favorite"
        verbose_name = "Избранный автомобиль"
        verbose_name_plural = "Избранные автомобили"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "car"], name="unique_user_car_favorite"),
        ]

    def __str__(self):
        return f"{self.user} — {self.car}"


class MotoFavorite(models.Model):
    """Избранная мототехника."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="moto_favorites",
        verbose_name="Пользователь",
    )
    motorcycle = models.ForeignKey(
        Motorcycle, on_delete=models.CASCADE, related_name="moto_favorites", verbose_name="Мототехника"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")

    class Meta:
        db_table = "cars_moto_favorite"
        verbose_name = "Избранная мототехника"
        verbose_name_plural = "Избранная мототехника"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "motorcycle"], name="unique_user_moto_favorite"),
        ]

    def __str__(self):
        return f"{self.user} — {self.motorcycle}"
