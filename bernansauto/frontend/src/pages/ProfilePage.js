import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import OnlineCarEvaluationPanel from '../components/OnlineCarEvaluationPanel';
import { api } from '../api';
import { formatMotoEngineVolume } from '../utils/motoFormat';
import '../styles/ProfilePage.css';

function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://127.0.0.1:8000${url}`;
}

const APPLICATION_STATUS_CLASS = {
  новая: 'status-new',
  в_работе: 'status-progress',
  ожидает_клиента: 'status-waiting',
  выполнена: 'status-done',
  отменена: 'status-cancelled',
};

function formatApplicationDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ProfilePage() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'applications');
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteModalError, setDeleteModalError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [favoriteCars, setFavoriteCars] = useState([]);
  const [favoriteMotos, setFavoriteMotos] = useState([]);
  const [favoriteCarsById, setFavoriteCarsById] = useState({});
  const [favoriteMotosById, setFavoriteMotosById] = useState({});
  const [favoriteViewMode, setFavoriteViewMode] = useState('grid');
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    username: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const navigate = useNavigate();

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
        setSettingsForm((prev) => ({
          ...prev,
          username: res.data.username || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
        }));
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setFavoriteCars([]);
      setFavoriteMotos([]);
      return;
    }

    let isMounted = true;
    const loadFavorites = async () => {
      setFavoritesLoading(true);
      try {
        const [carFavRes, motoFavRes, carsRes, motosRes, carPhotosRes, motoPhotosRes] = await Promise.all([
          api.get('cars/car-favorites/').catch(() => ({ data: [] })),
          api.get('cars/moto-favorites/').catch(() => ({ data: [] })),
          api.get('cars/').catch(() => ({ data: [] })),
          api.get('cars/motorcycles/').catch(() => ({ data: [] })),
          api.get('cars/car-photos/').catch(() => ({ data: [] })),
          api.get('cars/moto-photos/').catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;
        const cars = Array.isArray(carsRes.data) ? carsRes.data : [];
        const motos = Array.isArray(motosRes.data) ? motosRes.data : [];

        const favoriteCarIds = new Set((Array.isArray(carFavRes.data) ? carFavRes.data : []).map((x) => x.car));
        const favoriteMotoIds = new Set((Array.isArray(motoFavRes.data) ? motoFavRes.data : []).map((x) => x.motorcycle));

        setFavoriteCars(cars.filter((c) => favoriteCarIds.has(c.id)));
        setFavoriteMotos(motos.filter((m) => favoriteMotoIds.has(m.id)));

        const carPhotoMap = {};
        for (const photo of (Array.isArray(carPhotosRes.data) ? carPhotosRes.data : [])) {
          if (!photo?.car || carPhotoMap[photo.car]) continue;
          const resolved = resolveMediaUrl(photo.photo);
          if (resolved) carPhotoMap[photo.car] = resolved;
        }
        setFavoriteCarsById(carPhotoMap);

        const motoPhotoMap = {};
        for (const photo of (Array.isArray(motoPhotosRes.data) ? motoPhotosRes.data : [])) {
          if (!photo?.motorcycle || motoPhotoMap[photo.motorcycle]) continue;
          const resolved = resolveMediaUrl(photo.photo);
          if (resolved) motoPhotoMap[photo.motorcycle] = resolved;
        }
        setFavoriteMotosById(motoPhotoMap);
      } finally {
        if (isMounted) setFavoritesLoading(false);
      }
    };

    loadFavorites();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setApplications([]);
      return;
    }

    let isMounted = true;
    const loadApplications = async () => {
      setApplicationsLoading(true);
      try {
        const [carRes, motoRes] = await Promise.all([
          api.get('evaluations/car-applications/').catch(() => ({ data: [] })),
          api.get('evaluations/moto-applications/').catch(() => ({ data: [] })),
        ]);
        if (!isMounted) return;

        const carApps = (Array.isArray(carRes.data) ? carRes.data : []).map((app) => ({
          ...app,
          vehicleKind: 'car',
          vehicle_title: app.car_title,
          vehicle_slug: app.car_slug,
        }));
        const motoApps = (Array.isArray(motoRes.data) ? motoRes.data : []).map((app) => ({
          ...app,
          vehicleKind: 'moto',
          vehicle_title: app.motorcycle_title,
          vehicle_slug: app.motorcycle_slug,
        }));

        const merged = [...carApps, ...motoApps].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
        setApplications(merged);
      } catch {
        if (!isMounted) return;
        setApplications([]);
      } finally {
        if (isMounted) setApplicationsLoading(false);
      }
    };

    loadApplications();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const applicationsCount = useMemo(() => applications.length, [applications]);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post('accounts/logout/');
    } catch (error) {
      // If backend is unavailable, still redirect locally.
    } finally {
      setUser(null);
      setIsLoggingOut(false);
      navigate('/');
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (settingsForm.newPassword && settingsForm.newPassword !== settingsForm.confirmNewPassword) {
      setSettingsError('Новый пароль и подтверждение не совпадают.');
      return;
    }

    setIsSavingSettings(true);
    try {
      const payload = {
        username: settingsForm.username.trim(),
        email: settingsForm.email.trim().toLowerCase(),
        phone: settingsForm.phone.trim(),
      };
      if (settingsForm.newPassword) {
        payload.new_password = settingsForm.newPassword;
        payload.confirm_new_password = settingsForm.confirmNewPassword;
      }

      const { data } = await api.patch('accounts/me/', payload);
      setUser(data);
      setSettingsSuccess('Настройки аккаунта сохранены.');
      setSettingsForm((prev) => ({
        ...prev,
        newPassword: '',
        confirmNewPassword: '',
      }));
    } catch (error) {
      const data = error?.response?.data;
      const firstFieldError = data && typeof data === 'object'
        ? Object.values(data).flat().find(Boolean)
        : null;
      setSettingsError(firstFieldError || 'Не удалось сохранить настройки.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmText('');
    setDeleteModalError('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') {
      setDeleteModalError('Введите DELETE для подтверждения удаления.');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteModalError('');
    try {
      await api.delete('accounts/me/');
      setUser(null);
      navigate('/');
    } catch (error) {
      setDeleteModalError(error?.response?.data?.detail || 'Не удалось удалить аккаунт.');
      setIsDeletingAccount(false);
    }
  };

  const renderTabContent = () => {
    if (!user) return null;

    const removeFavoriteCar = async (event, carId) => {
      event.preventDefault();
      event.stopPropagation();
      await api.post('cars/favorites/car/toggle/', { car_id: carId });
      setFavoriteCars((prev) => prev.filter((item) => item.id !== carId));
    };

    const removeFavoriteMoto = async (event, motoId) => {
      event.preventDefault();
      event.stopPropagation();
      await api.post('cars/favorites/moto/toggle/', { motorcycle_id: motoId });
      setFavoriteMotos((prev) => prev.filter((item) => item.id !== motoId));
    };

    if (activeTab === 'onlineEvaluation') {
      return <OnlineCarEvaluationPanel />;
    }

    if (activeTab === 'applications') {
      return (
        <div className="profile-panel-card">
          <h2>Мои заявки</h2>
          {applicationsLoading && (
            <p className="profile-panel-muted">Загрузка заявок…</p>
          )}
          {!applicationsLoading && applicationsCount === 0 && (
            <p className="profile-panel-muted">
              У вас пока нет заявок. Откройте карточку автомобиля или мототехники и нажмите «Оставить заявку».
            </p>
          )}
          {!applicationsLoading && applicationsCount > 0 && (
            <div className="profile-applications-list">
              {applications.map((app) => {
                const detailPath = app.vehicle_slug
                  ? `${app.vehicleKind === 'moto' ? '/motorcycles' : '/cars'}/${encodeURIComponent(app.vehicle_slug)}`
                  : null;
                return (
                  <article key={`${app.vehicleKind}-${app.id}`} className="profile-application-card">
                    <div className="profile-application-head">
                      <div>
                        <span className="profile-application-kind">
                          {app.vehicleKind === 'moto' ? 'Мототехника' : 'Автомобиль'}
                        </span>
                        {detailPath ? (
                          <Link to={detailPath} className="profile-application-car">
                            {app.vehicle_title}
                          </Link>
                        ) : (
                          <div className="profile-application-car">{app.vehicle_title}</div>
                        )}
                        <div className="profile-application-type">{app.application_type_display}</div>
                      </div>
                      <span
                        className={`profile-application-status ${APPLICATION_STATUS_CLASS[app.status] || ''}`}
                      >
                        {app.status_display}
                      </span>
                    </div>
                    <p className="profile-application-summary">{app.summary}</p>
                    <time className="profile-application-date" dateTime={app.created_at}>
                      {formatApplicationDate(app.created_at)}
                    </time>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const renderFavoriteControls = () => (
      <div className="profile-favorites-controls">
        <button
          type="button"
          className={`profile-view-btn ${favoriteViewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setFavoriteViewMode('grid')}
          aria-label="Сетка"
          title="Показать сеткой"
        >
          ⠿
        </button>
        <button
          type="button"
          className={`profile-view-btn ${favoriteViewMode === 'list' ? 'active' : ''}`}
          onClick={() => setFavoriteViewMode('list')}
          aria-label="Список"
          title="Показать списком"
        >
          ☰
        </button>
      </div>
    );

    if (activeTab === 'favCars') {
      return (
        <div className="profile-panel-card">
          <h2>Избранные автомобили</h2>
          {renderFavoriteControls()}
          {favoritesLoading && <p className="profile-panel-muted">Загрузка избранных автомобилей...</p>}
          {!favoritesLoading && favoriteCars.length === 0 && (
            <p className="profile-panel-muted">Пока нет избранных автомобилей.</p>
          )}
          {!favoritesLoading && favoriteCars.length > 0 && (
            <div className={`profile-favorites-list ${favoriteViewMode === 'grid' ? 'grid-mode' : 'list-mode'}`}>
              {favoriteCars.map((car) => (
                <Link key={car.id} to={`/cars/${encodeURIComponent(car.slug)}`} className="profile-favorite-item">
                  <button
                    type="button"
                    className="profile-favorite-remove-btn"
                    onClick={(e) => removeFavoriteCar(e, car.id)}
                    aria-label="Убрать из избранного"
                    title="Убрать из избранного"
                  >
                    ✕
                  </button>
                  <div className="profile-favorite-thumb">
                    {favoriteCarsById[car.id] ? (
                      <img src={favoriteCarsById[car.id]} alt={`${car.marka} ${car.car_model}`} />
                    ) : (
                      <span>Нет фото</span>
                    )}
                  </div>
                  <div className="profile-favorite-text">
                    <div className="profile-favorite-title">{car.marka} {car.car_model}</div>
                    <div className="profile-favorite-meta">
                      {car.year} г. • {car.price_byn ? `${Number(car.price_byn).toLocaleString()} BYN` : 'Цена по запросу'}
                    </div>
                    <div className="profile-favorite-meta">
                      {Number(car.mileage || 0).toLocaleString()} км
                      {car.body_type ? ` • ${car.body_type}` : ''}
                      {car.transmission ? ` • ${car.transmission}` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'favMotos') {
      return (
        <div className="profile-panel-card">
          <h2>Избранные мотоциклы</h2>
          {renderFavoriteControls()}
          {favoritesLoading && <p className="profile-panel-muted">Загрузка избранной мототехники...</p>}
          {!favoritesLoading && favoriteMotos.length === 0 && (
            <p className="profile-panel-muted">Пока нет избранной мототехники.</p>
          )}
          {!favoritesLoading && favoriteMotos.length > 0 && (
            <div className={`profile-favorites-list ${favoriteViewMode === 'grid' ? 'grid-mode' : 'list-mode'}`}>
              {favoriteMotos.map((moto) => (
                <Link key={moto.id} to={`/motorcycles/${encodeURIComponent(moto.slug)}`} className="profile-favorite-item">
                  <button
                    type="button"
                    className="profile-favorite-remove-btn"
                    onClick={(e) => removeFavoriteMoto(e, moto.id)}
                    aria-label="Убрать из избранного"
                    title="Убрать из избранного"
                  >
                    ✕
                  </button>
                  <div className="profile-favorite-thumb">
                    {favoriteMotosById[moto.id] ? (
                      <img src={favoriteMotosById[moto.id]} alt={`${moto.marka} ${moto.moto_model}`} />
                    ) : (
                      <span>Нет фото</span>
                    )}
                  </div>
                  <div className="profile-favorite-text">
                    <div className="profile-favorite-title">{moto.marka} {moto.moto_model}</div>
                    <div className="profile-favorite-meta">
                      {moto.year} г. • {moto.price_byn ? `${Number(moto.price_byn).toLocaleString()} BYN` : 'Цена по запросу'}
                    </div>
                    <div className="profile-favorite-meta">
                      {Number(moto.mileage || 0).toLocaleString()} км
                      {moto.moto_type ? ` • ${moto.moto_type}` : ''}
                      {moto.engine_volume ? ` • ${formatMotoEngineVolume(moto.engine_volume)}` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="profile-panel-card">
        <h2>Настройки аккаунта</h2>
        <form className="profile-settings-form" onSubmit={handleSettingsSubmit}>
          <label htmlFor="profile-username">Имя пользователя</label>
          <input
            id="profile-username"
            type="text"
            value={settingsForm.username}
            onChange={(e) => setSettingsForm({ ...settingsForm, username: e.target.value })}
            required
          />

          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            type="email"
            value={settingsForm.email}
            onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
            required
          />

          <label htmlFor="profile-phone">Телефон</label>
          <input
            id="profile-phone"
            type="tel"
            placeholder="+375 (29) 123-45-67"
            value={settingsForm.phone}
            onChange={(e) => setSettingsForm({ ...settingsForm, phone: formatPhoneInput(e.target.value) })}
          />

          <label htmlFor="profile-new-password">Новый пароль (необязательно)</label>
          <input
            id="profile-new-password"
            type="password"
            placeholder="Минимум 8 символов, 1 строчная и 1 заглавная буква"
            value={settingsForm.newPassword}
            onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
            minLength={8}
          />

          <label htmlFor="profile-confirm-new-password">Подтверждение нового пароля</label>
          <input
            id="profile-confirm-new-password"
            type="password"
            value={settingsForm.confirmNewPassword}
            onChange={(e) => setSettingsForm({ ...settingsForm, confirmNewPassword: e.target.value })}
            minLength={8}
          />

          {settingsError && <div className="profile-status profile-status-error">{settingsError}</div>}
          {settingsSuccess && <div className="profile-status profile-status-success">{settingsSuccess}</div>}

          <div className="profile-settings-actions">
            <button type="submit" className="btn-primary" disabled={isSavingSettings}>
              {isSavingSettings ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              type="button"
              className="profile-delete-btn"
              onClick={openDeleteModal}
            >
              Удалить аккаунт
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="profile-page">
      <SiteHeader />
      <main className="profile-main">
        <div className="container">
          <div className="profile-layout">
            <section className="profile-content">
              <div className="profile-hero-card">
                {loading && <p>Загрузка...</p>}
                {!loading && !user && (
                  <>
                    <h1>Личный кабинет</h1>
                    <p>Вы не авторизованы. Нажмите "Войти" в шапке сайта.</p>
                    <Link to="/" className="btn-primary">На главную</Link>
                  </>
                )}

                {!loading && user && (
                  <div className="profile-hero-inner">
                    <div className="profile-avatar">
                      {(user.username || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h1>Добро пожаловать, {user.username}!</h1>
                      <div className="profile-hero-meta">
                        <span>{user.email || 'Email не указан'}</span>
                        <span>{user.phone || 'Телефон не указан'}</span>
                        <span>Регистрация: {user.date_registered || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!loading && user && renderTabContent()}
            </section>

            {!loading && user && (
              <aside className="profile-tabs">
                <button
                  type="button"
                  className={`profile-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('applications')}
                >
                  Заявки
                </button>
                <button
                  type="button"
                  className={`profile-tab-btn ${activeTab === 'onlineEvaluation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('onlineEvaluation')}
                >
                  Онлайн-оценка авто
                </button>
                <button
                  type="button"
                  className={`profile-tab-btn ${activeTab === 'favCars' ? 'active' : ''}`}
                  onClick={() => setActiveTab('favCars')}
                >
                  Избранные автомобили
                </button>
                <button
                  type="button"
                  className={`profile-tab-btn ${activeTab === 'favMotos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('favMotos')}
                >
                  Избранные мотоциклы
                </button>
                <button
                  type="button"
                  className={`profile-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  Настройки аккаунта
                </button>
                <button
                  type="button"
                  className="profile-tab-btn profile-tab-btn-danger"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Выходим...' : 'Выйти из аккаунта'}
                </button>
              </aside>
            )}
          </div>
        </div>
      </main>
      {isDeleteModalOpen && (
        <div className="delete-modal-overlay" role="presentation" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="delete-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Подтвердите удаление аккаунта</h3>
            <p>Это действие нельзя отменить. Введите <strong>DELETE</strong>.</p>
            <input
              type="text"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
            />
            {deleteModalError && <div className="profile-status profile-status-error">{deleteModalError}</div>}
            <div className="delete-modal-actions">
              <button type="button" className="btn-outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeletingAccount}>
                Отмена
              </button>
              <button type="button" className="profile-delete-btn profile-delete-btn-solid" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
                {isDeletingAccount ? 'Удаление...' : 'Удалить аккаунт'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
