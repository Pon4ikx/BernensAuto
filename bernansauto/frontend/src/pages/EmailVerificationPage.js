import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { api } from '../api';
import '../styles/EmailVerificationPage.css';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState('');
  const [resendStatus, setResendStatus] = useState('idle');
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async () => {
    if (!email) {
      setResendStatus('error');
      setResendMessage('Email не указан. Попробуйте зарегистрироваться снова.');
      return;
    }

    setResendStatus('loading');
    setResendMessage('');
    try {
      const { data } = await api.post('accounts/resend-verification/', { email });
      setResendStatus('success');
      setResendMessage(data?.detail || 'Письмо отправлено повторно.');
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Не удалось отправить письмо повторно.';
      setResendStatus('error');
      setResendMessage(detail);
    }
  };

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const { data } = await api.post('accounts/verify-email/', { token });
        setStatus('success');
        setMessage(data?.detail || 'Email успешно подтвержден.');
      } catch (error) {
        const detail = error?.response?.data?.detail || 'Не удалось подтвердить email.';
        setStatus('error');
        setMessage(detail);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="email-verification-page">
      <SiteHeader />
      <main className="email-verification-main">
        <div className="container">
          <div className="email-verification-card">
            {status === 'verifying' && (
              <>
                <h1>Проверяем email...</h1>
                <p>Подождите, выполняем подтверждение аккаунта.</p>
              </>
            )}

            {status === 'idle' && (
              <>
                <h1>Подтвердите email</h1>
                <p>
                  Мы отправили письмо со ссылкой для подтверждения
                  {email ? ` на ${email}` : ''}. Перейдите по ссылке из письма, чтобы завершить регистрацию.
                </p>
                {email && (
                  <div className="email-verification-resend">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={handleResend}
                      disabled={resendStatus === 'loading'}
                    >
                      {resendStatus === 'loading' ? 'Отправляем…' : 'Отправить письмо ещё раз'}
                    </button>
                    {resendMessage && (
                      <p className={`email-verification-resend-msg email-verification-resend-msg--${resendStatus}`}>
                        {resendMessage}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {status === 'success' && (
              <>
                <h1>Email подтвержден</h1>
                <p>{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <h1>Не удалось подтвердить email</h1>
                <p>{message}</p>
              </>
            )}

            <div className="email-verification-actions">
              <Link to="/" className="btn-outline">На главную</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
