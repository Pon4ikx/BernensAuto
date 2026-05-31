from rest_framework import serializers

from content.models import Contact
from cars.models import Car, Motorcycle

from .models import APPLICATION_TYPE_CHOICES, CarApplication, MotoApplication


def validate_application_extras(app_type, request):
    extra = request.data if request else {}
    errors = {}

    if app_type == "консультация":
        address_id = extra.get("consultation_address_id")
        if not address_id:
            errors["consultation_address_id"] = "Выберите адрес для консультации."
        elif not Contact.objects.filter(pk=address_id).exists():
            errors["consultation_address_id"] = "Выбранный адрес не найден."
        if not extra.get("consultation_date"):
            errors["consultation_date"] = "Выберите дату консультации."
        if not extra.get("consultation_time"):
            errors["consultation_time"] = "Выберите время консультации."

    if app_type == "покупка" and not extra.get("purchase_payment"):
        errors["purchase_payment"] = "Укажите способ оплаты."

    if errors:
        raise serializers.ValidationError(errors)


def build_application_message(attrs, request):
    app_type = attrs.get("application_type")
    user_message = (attrs.get("message") or "").strip()
    data = request.data if request else {}
    lines = []

    if app_type == "консультация":
        address_id = data.get("consultation_address_id")
        contact = Contact.objects.filter(pk=address_id).first()
        address_text = contact.address if contact else f"ID {address_id}"
        lines.append(f"Адрес: {address_text}")
        lines.append(f"Дата: {data.get('consultation_date')}")
        lines.append(f"Время: {data.get('consultation_time')}")
        if user_message:
            lines.append(user_message)
    elif app_type == "покупка":
        payment = data.get("purchase_payment")
        payment_labels = {"кредит": "Кредит", "полный_выкуп": "Полный выкуп"}
        lines.append(f"Способ оплаты: {payment_labels.get(payment, payment)}")
        if user_message:
            lines.append(user_message)
    elif user_message:
        lines.append(user_message)

    return "\n".join(lines).strip()


class ApplicationCreateSerializerMixin(serializers.Serializer):
    consultation_address_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    consultation_date = serializers.DateField(required=False, allow_null=True, write_only=True)
    consultation_time = serializers.CharField(required=False, allow_blank=True, write_only=True)
    purchase_payment = serializers.ChoiceField(
        choices=[("кредит", "Кредит"), ("полный_выкуп", "Полный выкуп")],
        required=False,
        allow_blank=True,
        write_only=True,
    )

    def validate_application_type(self, value):
        allowed = {choice[0] for choice in APPLICATION_TYPE_CHOICES}
        if value not in allowed:
            raise serializers.ValidationError("Недопустимый тип заявки.")
        return value

    def validate(self, attrs):
        validate_application_extras(attrs.get("application_type"), self.context.get("request"))
        return attrs

    def _finalize_create(self, validated_data):
        validated_data.pop("consultation_address_id", None)
        validated_data.pop("consultation_date", None)
        validated_data.pop("consultation_time", None)
        validated_data.pop("purchase_payment", None)

        user = self.context["request"].user
        validated_data["user"] = user
        validated_data["name"] = user.get_full_name() or user.username
        validated_data["email"] = user.email or ""
        validated_data["message"] = build_application_message(validated_data, self.context.get("request"))
        validated_data["status"] = "новая"
        return validated_data


class CarApplicationSerializer(serializers.ModelSerializer):
    application_type_display = serializers.CharField(
        source="get_application_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    car_title = serializers.SerializerMethodField()
    car_slug = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()

    class Meta:
        model = CarApplication
        fields = (
            "id",
            "application_type",
            "application_type_display",
            "status",
            "status_display",
            "message",
            "summary",
            "phone",
            "car",
            "car_title",
            "car_slug",
            "created_at",
        )
        read_only_fields = fields

    def get_car_title(self, obj):
        if not obj.car_id:
            return "—"
        car = obj.car
        return f"{car.marka} {car.car_model} ({car.year})"

    def get_car_slug(self, obj):
        return obj.car.slug if obj.car_id else None

    def get_summary(self, obj):
        text = (obj.message or "").strip()
        if not text:
            return "—"
        if len(text) > 140:
            return f"{text[:137]}..."
        return text


class CarApplicationCreateSerializer(ApplicationCreateSerializerMixin, serializers.ModelSerializer):
    car_id = serializers.PrimaryKeyRelatedField(
        queryset=Car.objects.all(), source="car", write_only=True
    )

    class Meta:
        model = CarApplication
        fields = (
            "car_id",
            "application_type",
            "phone",
            "message",
            "consultation_address_id",
            "consultation_date",
            "consultation_time",
            "purchase_payment",
        )

    def create(self, validated_data):
        validated_data = self._finalize_create(validated_data)
        return super().create(validated_data)


class MotoApplicationSerializer(serializers.ModelSerializer):
    application_type_display = serializers.CharField(
        source="get_application_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    motorcycle_title = serializers.SerializerMethodField()
    motorcycle_slug = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()

    class Meta:
        model = MotoApplication
        fields = (
            "id",
            "application_type",
            "application_type_display",
            "status",
            "status_display",
            "message",
            "summary",
            "phone",
            "motorcycle",
            "motorcycle_title",
            "motorcycle_slug",
            "created_at",
        )
        read_only_fields = fields

    def get_motorcycle_title(self, obj):
        if not obj.motorcycle_id:
            return "—"
        moto = obj.motorcycle
        return f"{moto.marka} {moto.moto_model} ({moto.year})"

    def get_motorcycle_slug(self, obj):
        return obj.motorcycle.slug if obj.motorcycle_id else None

    def get_summary(self, obj):
        text = (obj.message or "").strip()
        if not text:
            return "—"
        if len(text) > 140:
            return f"{text[:137]}..."
        return text


class MotoApplicationCreateSerializer(ApplicationCreateSerializerMixin, serializers.ModelSerializer):
    motorcycle_id = serializers.PrimaryKeyRelatedField(
        queryset=Motorcycle.objects.all(), source="motorcycle", write_only=True
    )

    class Meta:
        model = MotoApplication
        fields = (
            "motorcycle_id",
            "application_type",
            "phone",
            "message",
            "consultation_address_id",
            "consultation_date",
            "consultation_time",
            "purchase_payment",
        )

    def create(self, validated_data):
        validated_data = self._finalize_create(validated_data)
        return super().create(validated_data)
