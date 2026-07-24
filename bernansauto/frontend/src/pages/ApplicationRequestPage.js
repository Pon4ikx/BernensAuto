import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import Breadcrumbs from '../components/Breadcrumbs';
import { api } from '../api';
import '../styles/MainPage.css';
import '../styles/CarPurchaseRequestPage.css';

const APPLICATION_TYPES = [
  { value: 'обратный_звонок', label: 'Обратный звонок' },
  { value: 'консультация', label: 'Консультация' },
  { value: 'трейд-ин', label: 'Trade-in' },
  { value: 'покупка', label: 'Покупка' },
];

const TIME_SLOTS = Array.from({ length: 9 }, (_, i) => {
  const hour = 10 + i;
  return `${String(hour).padStart(2, '0')}:00`;
});

const TYPE_HINTS = {
  обратный_звонок: 'Укажите номер телефона для связи (необязательное поле)',
  консультация: 'Выберите адрес, дату и удобное время. Дополнительные пожелания — в поле сообщения.',
  'трейд-ин': 'Укажите номер телефона для связи (необязательное поле)',
  покупка: 'Номер телефона для связи (необязательное поле). Укажите способ оплаты.',
};

const VEHICLE_CONFIG = {
  car: {
    listEndpoint: 'cars/',
    createEndpoint: 'evaluations/car-applications/',
    payloadIdField: 'car_id',
    notFoundError: 'Автомобиль не найден.',
    notSelectedError: 'Автомобиль не выбран.',
    catalogPath: '/cars',
    catalogLabel: 'Автомобили',
    heroTitle: 'Заявка на автомобиль',
    heroFallback: 'Оформление заявки на выбранный автомобиль',
    backLabel: 'Назад к автомобилю',
    getTitle: (v) => `${v.marka} ${v.car_model}`,
  },
  moto: {
    listEndpoint: 'cars/motorcycles/',
    createEndpoint: 'evaluations/moto-applications/',
    payloadIdField: 'motorcycle_id',
    notFoundError: 'Мототехника не найдена.',
    notSelectedError: 'Мототехника не выбрана.',
    catalogPath: '/motorcycles',
    catalogLabel: 'Мототехника',
    heroTitle: 'Заявка на мототехнику',
    heroFallback: 'Оформление заявки на выбранную мототехнику',
    backLabel: 'Назад к мототехнике',
    getTitle: (v) => `${v.marka} ${v.moto_model}`,
  },
};

function formatPhoneInput(value) {
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
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ApplicationRequestPage({ vehicleKind = 'car' }) {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const config = VEHICLE_CONFIG[vehicleKind] || VEHICLE_CONFIG.car;

  const [vehicle, setVehicle] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [notice, setNotice] = useState('');

  const [applicationType, setApplicationType] = useState('обратный_звонок');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consultationAddressId, setConsultationAddressId] = useState('');
  const [consultationDate, setConsultationDate] = useState('');
  const [consultationTime, setConsultationTime] = useState('');
  const [purchasePayment, setPurchasePayment] = useState('');

  const openAuthPanel = () => {
    window.dispatchEvent(new CustomEvent('open-auth-panel', { detail: { tab: 'login' } }));
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const cfg = VEHICLE_CONFIG[vehicleKind] || VEHICLE_CONFIG.car;
      try {
        setLoading(true);
        setErrorText('');

        const [vehiclesRes, contactsRes, meRes] = await Promise.all([
          api.get(cfg.listEndpoint),
          api.get('content/contacts/'),
          api.get('accounts/me/').catch(() => null),
        ]);

        if (!isMounted) return;

        const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
        const selected = vehicles.find((v) => String(v.id) === String(vehicleId));
        if (!selected) {
          setErrorText(cfg.notFoundError);
          setVehicle(null);
        } else {
          setVehicle(selected);
        }

        setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);

        if (meRes?.data?.id) {
          setUser(meRes.data);
          setPhone(meRes.data.phone ? formatPhoneInput(meRes.data.phone) : '');
        } else {
          setUser(null);
        }
      } catch {
        if (!isMounted) return;
        setErrorText('Не удалось загрузить данные. Проверьте, что бэкенд запущен.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [vehicleId, vehicleKind]);

  const hint = TYPE_HINTS[applicationType] || '';
  const showPhone = ['обратный_звонок', 'трейд-ин', 'покупка'].includes(applicationType);
  const showConsultation = applicationType === 'консультация';
  const showPurchase = applicationType === 'покупка';

  const contactOptions = useMemo(
    () => contacts.filter((c) => c.address),
    [contacts],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice('');
    setErrorText('');

    if (!user?.id) {
      openAuthPanel();
      setErrorText('Войдите в аккаунт, чтобы отправить заявку.');
      return;
    }

    if (!vehicle?.id) {
      setErrorText(config.notSelectedError);
      return;
    }

    const payload = {
      [config.payloadIdField]: vehicle.id,
      application_type: applicationType,
      phone: phone.trim(),
      message: message.trim(),
    };

    if (showConsultation) {
      payload.consultation_address_id = Number(consultationAddressId);
      payload.consultation_date = consultationDate;
      payload.consultation_time = consultationTime;
    }

    if (showPurchase) {
      payload.purchase_payment = purchasePayment;
    }

    try {
      setSubmitting(true);
      await api.post(config.createEndpoint, payload);
      setNotice('Заявка отправлена. Статус можно отслеживать в личном кабинете.');
      setTimeout(() => navigate('/profile', { state: { tab: 'applications' } }), 1200);
    } catch (err) {
      const data = err?.response?.data;
      if (typeof data === 'string' && data.includes('<!DOCTYPE')) {
        setErrorText('Ошибка на сервере. Перезапустите бэкенд и попробуйте снова.');
      } else if (typeof data === 'string') {
        setErrorText(data);
      } else if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        setErrorText(Array.isArray(val) ? val[0] : String(val));
      } else if (err?.response?.status === 401) {
        openAuthPanel();
        setErrorText('Сессия истекла. Войдите снова.');
      } else {
        setErrorText('Не удалось отправить заявку. Попробуйте позже.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const detailPath = vehicle?.slug
    ? `${config.catalogPath}/${encodeURIComponent(vehicle.slug)}`
    : config.catalogPath;

  return (
    <div className="car-request-page">
      <SiteHeader />
      <main className="car-request-main">
        <Breadcrumbs
          lead
          items={[
            { to: '/', label: 'Главная' },
            { to: config.catalogPath, label: config.catalogLabel },
            ...(vehicle ? [{ to: detailPath, label: config.getTitle(vehicle) }] : []),
            { label: 'Заявка' },
          ]}
        />

        <div className="container car-request-container">
          <div className="car-request-hero">
            <h1>{config.heroTitle}</h1>
            {vehicle ? (
              <p>
                {config.getTitle(vehicle)}, {vehicle.year} г.
                {vehicle.price_byn ? ` — ${Number(vehicle.price_byn).toLocaleString('ru-RU')} BYN` : ''}
              </p>
            ) : (
              <p>{config.heroFallback}</p>
            )}
          </div>

          {loading && <div className="car-request-muted">Загрузка…</div>}
          {errorText && !loading && <div className="car-request-error">{errorText}</div>}

          {!loading && vehicle && (
            <form className="car-request-form" onSubmit={handleSubmit} noValidate>
              {!user?.id && (
                <div className="car-request-auth-hint">
                  Для отправки заявки нужен{' '}
                  <button type="button" className="car-request-auth-link" onClick={openAuthPanel}>
                    вход в аккаунт
                  </button>
                  .
                </div>
              )}

              <div className="car-request-fields">
                <label className="car-request-label car-request-label-full">
                  Тип заявки
                  <span className="car-request-select-wrap">
                    <select
                      className="car-request-input car-request-select"
                      value={applicationType}
                      onChange={(e) => {
                        setApplicationType(e.target.value);
                        setNotice('');
                        setErrorText('');
                      }}
                    >
                      {APPLICATION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </span>
                </label>

                {hint && (
                  <p className="car-request-type-hint car-request-label-full">{hint}</p>
                )}

                {showPhone && (
                  <label className="car-request-label">
                    Телефон
                    <input
                      className="car-request-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                      placeholder="+375 (29) 123-45-67"
                    />
                  </label>
                )}

                {showConsultation && (
                  <>
                    <label className="car-request-label car-request-label-full">
                      Адрес консультации
                      <span className="car-request-select-wrap">
                        <select
                          className="car-request-input car-request-select"
                          value={consultationAddressId}
                          onChange={(e) => setConsultationAddressId(e.target.value)}
                          required
                        >
                          <option value="">Выберите адрес</option>
                          {contactOptions.map((c) => (
                            <option key={c.id} value={c.id}>{c.address}</option>
                          ))}
                        </select>
                      </span>
                    </label>

                    <label className="car-request-label">
                      Дата
                      <span className="car-request-date-wrap">
                        <input
                          className="car-request-input car-request-date"
                          type="date"
                          min={todayIso()}
                          value={consultationDate}
                          onChange={(e) => setConsultationDate(e.target.value)}
                          required
                        />
                      </span>
                    </label>

                    <label className="car-request-label">
                      Время
                      <span className="car-request-select-wrap">
                        <select
                          className="car-request-input car-request-select"
                          value={consultationTime}
                          onChange={(e) => setConsultationTime(e.target.value)}
                          required
                        >
                          <option value="">Выберите время</option>
                          {TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </span>
                    </label>
                  </>
                )}

                {showPurchase && (
                  <label className="car-request-label car-request-label-full">
                    Способ оплаты
                    <span className="car-request-select-wrap">
                      <select
                        className="car-request-input car-request-select"
                        value={purchasePayment}
                        onChange={(e) => setPurchasePayment(e.target.value)}
                        required
                      >
                        <option value="">Выберите вариант</option>
                        <option value="кредит">Покупка в кредит</option>
                        <option value="полный_выкуп">Полный выкуп</option>
                      </select>
                    </span>
                  </label>
                )}

                <label className="car-request-label car-request-label-full">
                  {showConsultation ? 'Дополнительное сообщение' : 'Сообщение'}
                  <textarea
                    className="car-request-textarea"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      showConsultation
                        ? 'Пожелания по консультации, вопросы…'
                        : 'Комментарий к заявке (необязательно)'
                    }
                  />
                </label>
              </div>

              {notice && <div className="car-request-notice car-request-notice--success" role="status">{notice}</div>}

              <div className="car-request-actions">
                <button
                  type="submit"
                  className="btn-primary car-request-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Отправка…' : 'Отправить заявку'}
                </button>
                <Link to={detailPath} className="car-request-link">
                  {config.backLabel}
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
