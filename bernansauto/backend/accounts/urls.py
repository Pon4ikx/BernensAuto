from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    LogoutView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    ResendVerificationEmailView,
    UserViewSet,
    VerifyEmailView,
)

router = DefaultRouter()
router.register(r'', UserViewSet)

urlpatterns = [
    path('login/', LoginView.as_view(), name='accounts-login'),
    path('register/', RegisterView.as_view(), name='accounts-register'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='accounts-resend-verification'),
    path('verify-email/', VerifyEmailView.as_view(), name='accounts-verify-email'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='accounts-password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='accounts-password-reset-confirm'),
    path('logout/', LogoutView.as_view(), name='accounts-logout'),
    path('me/', MeView.as_view(), name='accounts-me'),
] + router.urls
