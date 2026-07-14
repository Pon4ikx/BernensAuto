from django.db.models import Q
from rest_framework import serializers
import re
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'phone',
            'date_registered',
            'is_staff',
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'phone', 'password')

    def validate_username(self, value):
        return value.strip()

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        username = attrs.get('username', '')
        email = attrs.get('email', '')

        if not email:
            raise serializers.ValidationError({'email': 'Email обязателен для регистрации.'})

        conflicts = User.objects.filter(
            Q(username=username) | Q(email__iexact=email)
        ).only('username', 'email')

        for existing in conflicts:
            if existing.username == username:
                raise serializers.ValidationError({
                    'username': 'Пользователь с таким именем пользователя уже существует.',
                })
            if existing.email.lower() == email:
                raise serializers.ValidationError({
                    'email': 'Пользователь с таким email уже существует.',
                })

        return attrs

    def validate_password(self, value):
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы одну строчную букву.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы одну заглавную букву.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            phone=validated_data.get('phone', ''),
            password=validated_data['password'],
            is_active=False,
        )


class AccountSettingsSerializer(serializers.ModelSerializer):
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'phone', 'new_password', 'confirm_new_password')

    def validate_username(self, value):
        user = self.instance
        if User.objects.exclude(id=user.id).filter(username=value).exists():
            raise serializers.ValidationError("Пользователь с таким именем пользователя уже существует.")
        return value

    def validate_email(self, value):
        user = self.instance
        email = value.strip().lower()
        if not email:
            raise serializers.ValidationError("Email обязателен.")
        if User.objects.exclude(id=user.id).filter(email__iexact=email).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return email

    def validate(self, attrs):
        new_password = attrs.get('new_password', '')
        confirm_new_password = attrs.get('confirm_new_password', '')

        if new_password or confirm_new_password:
            if new_password != confirm_new_password:
                raise serializers.ValidationError({"confirm_new_password": "Пароли не совпадают."})
            if not re.search(r'[a-z]', new_password):
                raise serializers.ValidationError({"new_password": "Пароль должен содержать хотя бы одну строчную букву."})
            if not re.search(r'[A-Z]', new_password):
                raise serializers.ValidationError({"new_password": "Пароль должен содержать хотя бы одну заглавную букву."})

        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop('new_password', '')
        validated_data.pop('confirm_new_password', '')

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if new_password:
            instance.set_password(new_password)

        instance.save()
        return instance
