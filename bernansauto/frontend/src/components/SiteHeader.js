import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api';
import ScrollToTopButton from './ScrollToTopButton';

export default function SiteHeader() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const formatPhoneInput = (value) => {
    const digits = value.replace(/\D/g, '');
    const normalized = digits.startsWith('375') ? digits.slice(3, 12) : digits.slice(0, 9);
    const p1 = normalized.slice(0, 2);
    const p2 = normalized.slice(2, 5);
    const p3 = normalized.slice(5, 7);
    const p4 = normalized.slice(7, 9);

    let result = '+375';
    if (p1) result += ` (${p1}`;
    if (p1.length === 2) result += ')';
    if (p2) result += ` ${p2}`;
    if (p3) result += `-${p3}`;
    if (p4) result += `-${p4}`;
    return result;
  };

  useEffect(() => {
    api.get('accounts/me/')
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  const openAuth = () => {
    setAuthError('');
    setIsAuthPanelOpen(true);
    setAuthTab('login');
  };

  useEffect(() => {
    const handleOpenAuthPanel = (event) => {
      const tab = event?.detail?.tab;
      setAuthError('');
      setIsAuthPanelOpen(true);
      setAuthTab(tab === 'register' ? 'register' : 'login');
    };
    window.addEventListener('open-auth-panel', handleOpenAuthPanel);
    return () => window.removeEventListener('open-auth-panel', handleOpenAuthPanel);
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const { data } = await api.post('accounts/login/', loginForm);
      setUser(data);
      setIsAuthPanelOpen(false);
      setLoginForm({ login: '', password: '' });
    } catch (error) {
      const message = error?.response?.data?.detail || 'Не удалось войти. Проверьте данные.';
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('Пароли не совпадают.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        username: registerForm.username.trim(),
        phone: registerForm.phone.trim(),
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
      };
      await api.post('accounts/register/', payload);
      setIsAuthPanelOpen(false);
      setRegisterForm({ username: '', phone: '', email: '', password: '', confirmPassword: '' });
      setShowRegisterPassword(false);
      setShowRegisterConfirmPassword(false);
      navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`);
    } catch (error) {
      const data = error?.response?.data;
      const firstFieldError = data && typeof data === 'object'
        ? Object.values(data).flat().find(Boolean)
        : null;
      setAuthError(firstFieldError || 'Не удалось зарегистрироваться.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="site-header-root">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Link to="/" className="logo-link">
                <span className="logo-inner">
                  <img src={process.env.PUBLIC_URL + '/icon.png'} alt="Bernans Auto" className="logo-icon" />
                  <span className="logo-text">Bernans Auto</span>
                </span>
              </Link>
            </div>

            <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
              <NavLink to="/cars" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Автомобили
              </NavLink>
              <NavLink to="/motorcycles" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Мототехника
              </NavLink>
              <NavLink to="/services" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Услуги
              </NavLink>
              <NavLink to="/news" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Новости
              </NavLink>
              <Link to="/contacts" className="nav-link">Контакты</Link>
              {user?.is_staff && (
                <a
                  href="http://localhost:8000/admin/"
                  target="_blank"
                  rel="noreferrer"
                  className="nav-link nav-link-admin"
                >
                  Админ-панель
                </a>
              )}

              {user ? (
                <Link to="/profile" className="login-btn login-btn-account">
                  <span className="login-btn-account-name">{user.username || 'Пользователь'}</span>
                  <span className="login-btn-account-label">Аккаунт</span>
                </Link>
              ) : (
                <button type="button" className="login-btn" onClick={openAuth}>
                  Войти
                </button>
              )}
            </nav>

            <button
              className="menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Меню"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Оверлей и панель входа/регистрации (выезжает справа по кнопке «Войти») */}
      <div
        className={`auth-overlay ${isAuthPanelOpen ? 'open' : ''}`}
        onClick={() => setIsAuthPanelOpen(false)}
        aria-hidden="true"
      />
      <div className={`auth-panel ${isAuthPanelOpen ? 'open' : ''}`}>
        <div className="auth-panel-header">
          <h2>Вход в аккаунт</h2>
          <button
            type="button"
            className="auth-panel-close"
            onClick={() => setIsAuthPanelOpen(false)}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
            onClick={() => setAuthTab('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={`auth-tab ${authTab === 'register' ? 'active' : ''}`}
            onClick={() => setAuthTab('register')}
          >
            Регистрация
          </button>
        </div>
        <div className="auth-panel-body">
          {authTab === 'login' && (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <label htmlFor="auth-login">Логин или Email</label>
              <input
                id="auth-login"
                type="text"
                placeholder="username или example@mail.com"
                autoComplete="username"
                value={loginForm.login}
                onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                required
              />
              <label htmlFor="auth-password">Пароль</label>
              <div className="password-input-wrap">
                <input
                  id="auth-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                >
                  {showLoginPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>
              {authError && <div className="auth-hint" style={{ color: '#b00020' }}>{authError}</div>}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => navigate('/forgot-password')}
              >
                Забыли пароль?
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Вход...' : 'Войти'}
              </button>
            </form>
          )}

          {authTab === 'register' && (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <label htmlFor="reg-username">Имя пользователя</label>
              <input
                id="reg-username"
                type="text"
                placeholder="Username"
                autoComplete="username"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
              />
              <label htmlFor="reg-phone">Телефон</label>
              <input
                id="reg-phone"
                type="tel"
                placeholder="+375 (29) 123-45-67"
                autoComplete="tel"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: formatPhoneInput(e.target.value) })}
              />
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                placeholder="example@mail.com"
                autoComplete="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
              <label htmlFor="reg-password">Пароль</label>
              <div className="password-input-wrap">
                <input
                  id="reg-password"
                  type={showRegisterPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                >
                  {showRegisterPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>
              <label htmlFor="reg-password-confirm">Подтверждение пароля</label>
              <div className="password-input-wrap">
                <input
                  id="reg-password-confirm"
                  type={showRegisterConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                >
                  {showRegisterConfirmPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>

              <div className="auth-hint">
                Пароль: минимум 8 символов, минимум 1 строчная и 1 заглавная буква.
              </div>
              {authError && <div className="auth-hint" style={{ color: '#b00020' }}>{authError}</div>}
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>

            </form>
          )}
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}

