from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    message = 'Доступ только для персонала.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsSuperUser(BasePermission):
    message = 'Доступ только для суперпользователя.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
