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
