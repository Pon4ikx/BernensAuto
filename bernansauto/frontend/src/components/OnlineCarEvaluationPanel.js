import React, { useEffect, useState } from 'react';
import { api } from '../api';
import '../styles/OnlineCarEvaluation.css';

const BODY_TYPES = [
  'Седан',
  'Хэтчбек',
  'Универсал',
  'Кроссовер',
  'Внедорожник',
  'Купе',
  'Минивэн',
  'Пикап',
  'Другое',
];

const TRANSMISSION_OPTIONS = [
  { value: 'автомат', label: 'Автомат' },
  { value: 'механика', label: 'Механика' },
];

const STATUS_CLASS = {
  новая: 'status-new',
  в_работе: 'status-progress',
  ожидает_клиента: 'status-waiting',
  выполнена: 'status-done',
  отменена: 'status-cancelled',
};

const initialForm = {
  marka: '',
  car_model: '',
  body_type: '',
  year: '',
  engine_volume: '',
  transmission: 'автомат',
  condition: '7',
  comments: '',
};

function formatDate(iso) {
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

export default function OnlineCarEvaluationPanel() {
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [notice, setNotice] = useState('');

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await api.get('evaluations/online-car-evaluations/');
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorText) setErrorText('');
    if (notice) setNotice('');
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos(files);
    if (notice) setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    setNotice('');

    if (!form.marka.trim() || !form.car_model.trim() || !form.body_type || !form.year) {
      setErrorText('Заполните марку, модель, кузов и год выпуска.');
      return;
    }

    const yearNum = Number(form.year);
    const currentYear = new Date().getFullYear() + 1;
    if (Number.isNaN(yearNum) || yearNum < 1950 || yearNum > currentYear) {
      setErrorText(`Укажите корректный год (1950–${currentYear}).`);
      return;
    }

    const formData = new FormData();
    formData.append('marka', form.marka.trim());
    formData.append('car_model', form.car_model.trim());
    formData.append('body_type', form.body_type);
    formData.append('year', String(yearNum));
    if (form.engine_volume) {
      formData.append('engine_volume', String(form.engine_volume).replace(',', '.'));
    }
    formData.append('transmission', form.transmission);
    formData.append('condition', form.condition);
    formData.append('comments', form.comments.trim());
    photos.forEach((file) => formData.append('photos', file));

    try {
      setSubmitting(true);
      await api.post('evaluations/online-car-evaluations/', formData);
      setNotice('Заявка на оценку отправлена. Менеджер свяжется с вами после проверки данных.');
      setForm(initialForm);
      setPhotos([]);
      const input = document.getElementById('online-eval-photos');
      if (input) input.value = '';
      await loadHistory();
    } catch (err) {
      const data = err?.response?.data;
      if (typeof data === 'string' && data.includes('<!DOCTYPE')) {
        setErrorText('Ошибка на сервере. Перезапустите бэкенд и попробуйте снова.');
      } else if (typeof data === 'string') {
        setErrorText(data);
      } else if (data && typeof data === 'object') {
        const key = Object.keys(data)[0];
        const val = data[key];
        setErrorText(Array.isArray(val) ? val[0] : String(val));
      } else {
        setErrorText('Не удалось отправить заявку на оценку.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="online-eval-panel">
      <div className="profile-panel-card online-eval-form-card">
        <h2>Онлайн-оценка авто</h2>
        <p className="profile-panel-muted online-eval-intro">
          Отправьте данные о своём автомобиле в автохаус — мы оценим его и свяжемся с вами.
        </p>

        <form className="online-eval-form" onSubmit={handleSubmit} noValidate>
          <div className="online-eval-fields">
            <label className="online-eval-label">
              Марка
              <input
                className="online-eval-input"
                name="marka"
                type="text"
                value={form.marka}
                onChange={handleChange}
                placeholder="Например, Toyota"
                required
              />
            </label>

            <label className="online-eval-label">
              Модель
              <input
                className="online-eval-input"
                name="car_model"
                type="text"
                value={form.car_model}
                onChange={handleChange}
                placeholder="Например, Camry"
                required
              />
            </label>

            <label className="online-eval-label">
              Кузов
              <span className="online-eval-select-wrap">
                <select
                  className="online-eval-input online-eval-select"
                  name="body_type"
                  value={form.body_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите тип кузова</option>
                  {BODY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </span>
            </label>

            <label className="online-eval-label">
              Год выпуска
              <input
                className="online-eval-input"
                name="year"
                type="number"
                min={1950}
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={handleChange}
                placeholder="2018"
                required
              />
            </label>

            <label className="online-eval-label">
              Объём двигателя (л)
              <input
                className="online-eval-input"
                name="engine_volume"
                type="text"
                inputMode="decimal"
                value={form.engine_volume}
                onChange={handleChange}
                placeholder="2.0"
              />
            </label>

            <label className="online-eval-label">
              Коробка передач
              <span className="online-eval-select-wrap">
                <select
                  className="online-eval-input online-eval-select"
                  name="transmission"
                  value={form.transmission}
                  onChange={handleChange}
                  required
                >
                  {TRANSMISSION_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </span>
            </label>

            <label className="online-eval-label online-eval-label-full">
              Состояние: <strong>{form.condition}</strong> из 10
              <input
                className="online-eval-range"
                name="condition"
                type="range"
                min={1}
                max={10}
                step={1}
                value={form.condition}
                onChange={handleChange}
              />
              <div className="online-eval-range-labels">
                <span>1 — плохое</span>
                <span>10 — отличное</span>
              </div>
            </label>

            <label className="online-eval-label online-eval-label-full">
              Комментарии / нюансы
              <textarea
                className="online-eval-textarea"
                name="comments"
                rows={4}
                value={form.comments}
                onChange={handleChange}
                placeholder="Пробег, ДТП, комплектация, обслуживание, дефекты…"
              />
            </label>

            <div className="online-eval-label online-eval-label-full online-eval-photos-field">
              <span className="online-eval-label-text">Фотографии</span>
              <div className="online-eval-file-row">
                <label className="online-eval-file-btn" htmlFor="online-eval-photos">
                  <span className="online-eval-file-btn-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M9 3h6l1 2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l1-2zm3 16a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                    </svg>
                  </span>
                  <span className="online-eval-file-btn-text">Выбрать файлы</span>
                  <input
                    id="online-eval-photos"
                    className="online-eval-file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotosChange}
                  />
                </label>
                <span className={`online-eval-file-status${photos.length > 0 ? ' online-eval-file-status--selected' : ''}`}>
                  {photos.length > 0
                    ? `Выбрано: ${photos.length}`
                    : 'Файлы не выбраны'}
                </span>
              </div>
              {photos.length > 0 && (
                <ul className="online-eval-file-list">
                  {photos.map((file) => (
                    <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {errorText && <div className="online-eval-error">{errorText}</div>}
          {notice && <div className="online-eval-notice">{notice}</div>}

          <button type="submit" className="btn-primary online-eval-submit" disabled={submitting}>
            {submitting ? 'Отправка…' : 'Отправить на оценку'}
          </button>
        </form>
      </div>

      <div className="profile-panel-card online-eval-history-card">
        <h2>Мои заявки на оценку</h2>
        {loadingHistory && <p className="profile-panel-muted">Загрузка…</p>}
        {!loadingHistory && history.length === 0 && (
          <p className="profile-panel-muted">Вы ещё не отправляли автомобили на оценку.</p>
        )}
        {!loadingHistory && history.length > 0 && (
          <div className="profile-applications-list">
            {history.map((item) => (
              <article key={item.id} className="profile-application-card">
                <div className="profile-application-head">
                  <div>
                    <div className="profile-application-car">{item.vehicle_title}</div>
                    <div className="profile-application-type">
                      {item.body_type} · {item.transmission_display} · состояние {item.condition}/10
                    </div>
                  </div>
                  <span className={`profile-application-status ${STATUS_CLASS[item.status] || ''}`}>
                    {item.status_display}
                  </span>
                </div>
                {item.comments && (
                  <p className="profile-application-summary">{item.comments}</p>
                )}
                {item.photos?.length > 0 && (
                  <div className="online-eval-photo-previews">
                    {item.photos.map((p) => (
                      <a
                        key={p.id}
                        href={p.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="online-eval-photo-thumb"
                      >
                        <img src={p.photo_url} alt="" />
                      </a>
                    ))}
                  </div>
                )}
                <time className="profile-application-date" dateTime={item.created_at}>
                  {formatDate(item.created_at)}
                </time>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
