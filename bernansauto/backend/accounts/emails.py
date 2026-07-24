import logging
import threading

from django.conf import settings
from django.core import signing
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _dispatch_send_mail(*, subject, message, recipient_list, html_message):
    def worker():
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=None,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
        except Exception:
            logger.exception('Failed to send email: %s', subject)

    threading.Thread(target=worker, daemon=True).start()


def build_verification_url(user):
    signer = signing.TimestampSigner(salt='accounts.email_verification')
    token = signer.sign(str(user.id))
    return f"{settings.FRONTEND_BASE_URL.rstrip('/')}/verify-email?token={token}"


def send_verification_email(user):
    verify_url = build_verification_url(user)

    html = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.55; color: #20383f;">
      <h2 style="margin: 0 0 12px; color: #1995AD;">Подтверждение email</h2>
      <p style="margin: 0 0 10px;">Здравствуйте, <strong>{user.username}</strong>!</p>
      <p style="margin: 0 0 14px;">
        Чтобы завершить регистрацию, перейдите по <a href="{verify_url}" style="color: #1995AD; font-weight: 700;">ссылке</a>.
      </p>
      <div style="margin: 18px 0 10px;">
        <a href="{verify_url}" style="display: inline-block; background: #1995AD; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 700;">
          Подтвердить email
        </a>
      </div>
      <p style="margin: 14px 0 0; color: #66777c; font-size: 12px;">
        Если вы не регистрировались на Bernans Auto — просто проигнорируйте это письмо.
      </p>
    </div>
    """

    _dispatch_send_mail(
        subject='Подтверждение email для Bernans Auto',
        message=(
            f'Здравствуйте, {user.username}!\n\n'
            f'Чтобы завершить регистрацию, подтвердите email по ссылке.\n\n'
            f'{verify_url}\n\n'
            'Если вы не регистрировались на Bernans Auto, просто проигнорируйте это письмо.'
        ),
        recipient_list=[user.email],
        html_message=html,
    )


def send_password_reset_email(user):
    signer = signing.TimestampSigner(salt='accounts.password_reset')
    token = signer.sign(str(user.id))
    reset_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={token}"

    html = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.55; color: #20383f;">
      <h2 style="margin: 0 0 12px; color: #1995AD;">Сброс пароля</h2>
      <p style="margin: 0 0 10px;">Здравствуйте, <strong>{user.username}</strong>!</p>
      <p style="margin: 0 0 14px;">
        Чтобы сбросить пароль, перейдите по <a href="{reset_url}" style="color: #1995AD; font-weight: 700;">ссылке</a>.
      </p>
      <div style="margin: 18px 0 10px;">
        <a href="{reset_url}" style="display: inline-block; background: #1995AD; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 700;">
          Сбросить пароль
        </a>
      </div>
      <p style="margin: 14px 0 0; color: #66777c; font-size: 12px;">
        Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
      </p>
    </div>
    """

    _dispatch_send_mail(
        subject='Сброс пароля Bernans Auto',
        message=(
            f'Здравствуйте, {user.username}!\n\n'
            f'Чтобы сбросить пароль, перейдите по ссылке.\n\n'
            f'{reset_url}\n\n'
            'Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.'
        ),
        recipient_list=[user.email],
        html_message=html,
    )
