import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { api } from '../api';
import '../styles/EmailVerificationPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const { data } = await api.post('accounts/password-reset/request/', { email: email.trim().toLowerCase() });
      setStatus('success');
      setMessage(data?.detail || 'Если такой email существует, мы отправили письмо со ссылкой для сброса пароля.');
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Не удалось отправить письмо. Попробуйте позже.';
      setStatus('error');
      setMessage(detail);
    }
  };

  return (
    <div className="email-verification-page">
      <SiteHeader />
      <main className="email-verification-main">
        <div className="container">
          <div className="email-verification-card">
            <h1>Восстановление пароля</h1>
            <p>Укажите email, который вы использовали при регистрации. Мы отправим ссылку для сброса пароля.</p>

            <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {message && (
                <div
                  className="auth-hint"
                  style={{ color: status === 'error' ? '#b00020' : '#1f6b48' }}
                >
                  {message}
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Отправляем...' : 'Отправить ссылку'}
              </button>
            </form>
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
