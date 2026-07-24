import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { api } from '../api';
import '../styles/EmailVerificationPage.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    setStatus('idle');
    setMessage('');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Токен сброса пароля не найден. Откройте ссылку из письма.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setStatus('error');
      setMessage('Пароли не совпадают.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const { data } = await api.post('accounts/password-reset/confirm/', {
        token,
        new_password: form.password,
        confirm_new_password: form.confirmPassword,
      });
      setStatus('success');
      setMessage(data?.detail || 'Пароль обновлен. Теперь вы можете войти.');
      setIsSuccessModalOpen(true);
      setForm({ password: '', confirmPassword: '' });
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Не удалось обновить пароль.';
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
            <h1>Новый пароль</h1>
            <p>Введите новый пароль. Требования: минимум 8 символов, 1 строчная и 1 заглавная буква.</p>

            <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
              <label htmlFor="reset-pass">Новый пароль</label>
              <input
                id="reset-pass"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />

              <label htmlFor="reset-pass-confirm">Подтверждение пароля</label>
              <input
                id="reset-pass-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                minLength={8}
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
                {status === 'loading' ? 'Сохраняем...' : 'Сохранить пароль'}
              </button>
            </form>

            <div className="email-verification-actions">
              <Link to="/" className="btn-outline">На главную</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />

      {isSuccessModalOpen && (
        <div className="simple-modal-overlay" role="presentation" onClick={() => setIsSuccessModalOpen(false)}>
          <div className="simple-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Готово</h3>
            <p>{message || 'Пароль обновлен. Теперь вы можете войти.'}</p>
            <div className="simple-modal-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/')}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

