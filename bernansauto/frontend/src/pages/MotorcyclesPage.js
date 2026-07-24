import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/MainPage.css';
import '../styles/CarsPage.css';
import '../styles/Breadcrumbs.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { formatMotoEngineVolume } from '../utils/motoFormat';

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://127.0.0.1:8000${url}`;
}

export default function MotorcyclesPage() {
  const [motos, setMotos] = useState([]);
  const [motoPhotos, setMotoPhotos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [favoriteMotoIds, setFavoriteMotoIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const [draftFilters, setDraftFilters] = useState({
    priceFromUsd: '',
    priceToUsd: '',
    marka: '',
    model: '',
    yearFrom: '',
    yearTo: '',
    motoType: '',
    availableOnly: true,
  });

  const [appliedFilters, setAppliedFilters] = useState(draftFilters);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setErrorText('');

        const [motosRes, photosRes, meRes, favoritesRes] = await Promise.all([
          api.get('cars/motorcycles/'),
          api.get('cars/moto-photos/').catch(() => ({ data: [] })),
          api.get('accounts/me/').catch(() => null),
          api.get('cars/moto-favorites/').catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;
        setMotos(Array.isArray(motosRes.data) ? motosRes.data : []);
        setMotoPhotos(Array.isArray(photosRes.data) ? photosRes.data : []);
        setIsAuthenticated(Boolean(meRes?.data?.id));
        const ids = Array.isArray(favoritesRes.data) ? favoritesRes.data.map((item) => item.motorcycle) : [];
        setFavoriteMotoIds(ids);
      } catch (err) {
        if (!isMounted) return;
        setErrorText('Не удалось загрузить мототехнику. Проверь, что бэкенд запущен на http://127.0.0.1:8000');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const markas = useMemo(() => {
    const set = new Set();
    for (const m of motos) {
      if (m?.marka) set.add(m.marka);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [motos]);

  const modelsForSelectedMarka = useMemo(() => {
    const set = new Set();
    for (const m of motos) {
      if (!m) continue;
      if (draftFilters.marka && m.marka !== draftFilters.marka) continue;
      if (m.moto_model) set.add(m.moto_model);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [motos, draftFilters.marka]);

  const years = useMemo(() => {
    const set = new Set();
    for (const m of motos) {
      if (typeof m?.year === 'number') set.add(m.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [motos]);

  const motoTypes = useMemo(() => {
    const set = new Set();
    for (const m of motos) {
      if (m?.moto_type) set.add(m.moto_type);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [motos]);

  const firstPhotoByMotoId = useMemo(() => {
    const map = new Map();
    for (const p of motoPhotos) {
      const motoId = p?.motorcycle;
      const url = resolveMediaUrl(p?.photo);
      if (!motoId || !url) continue;
      if (!map.has(motoId)) map.set(motoId, url);
    }
    return map;
  }, [motoPhotos]);

  const filteredMotos = useMemo(() => {
    const priceFrom = toNumber(appliedFilters.priceFromUsd);
    const priceTo = toNumber(appliedFilters.priceToUsd);
    const yearFrom = toNumber(appliedFilters.yearFrom);
    const yearTo = toNumber(appliedFilters.yearTo);

    return motos.filter((m) => {
      if (!m) return false;

      if (appliedFilters.availableOnly && m.available === false) return false;

      if (appliedFilters.marka && m.marka !== appliedFilters.marka) return false;
      if (appliedFilters.model && m.moto_model !== appliedFilters.model) return false;
      if (appliedFilters.motoType && m.moto_type !== appliedFilters.motoType) return false;

      if (yearFrom !== null && Number(m.year) < yearFrom) return false;
      if (yearTo !== null && Number(m.year) > yearTo) return false;

      const priceUsd = m.price_usd !== null && m.price_usd !== undefined ? Number(m.price_usd) : null;
      if (priceFrom !== null && (priceUsd === null || priceUsd < priceFrom)) return false;
      if (priceTo !== null && (priceUsd === null || priceUsd > priceTo)) return false;

      return true;
    });
  }, [motos, appliedFilters]);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    const el = document.getElementById('motos-results');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    const base = {
      priceFromUsd: '',
      priceToUsd: '',
      marka: '',
      model: '',
      yearFrom: '',
      yearTo: '',
      motoType: '',
      availableOnly: true,
    };
    setDraftFilters(base);
    setAppliedFilters(base);
  };

  const openAuthPanel = () => {
    window.dispatchEvent(new CustomEvent('open-auth-panel', { detail: { tab: 'login' } }));
  };

  const toggleFavorite = async (event, motorcycleId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      openAuthPanel();
      return;
    }

    try {
      const { data } = await api.post('cars/favorites/moto/toggle/', { motorcycle_id: motorcycleId });
      setFavoriteMotoIds((prev) => {
        const has = prev.includes(motorcycleId);
        if (data?.is_favorite && !has) return [...prev, motorcycleId];
        if (!data?.is_favorite && has) return prev.filter((id) => id !== motorcycleId);
        return prev;
      });
    } catch (error) {
      if (error?.response?.status === 401) {
        setIsAuthenticated(false);
        openAuthPanel();
      }
    }
  };

  return (
    <div className="cars-page">
      <SiteHeader />

      <main className="catalog-main">
        <section className="catalog-hero">
          <div className="container">
            <h2>Мототехника</h2>
            <p>Каталог мототехники с фильтрами по цене, марке, году и типу.</p>
          </div>
        </section>

        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <div className="container breadcrumbs-inner">
            <Link to="/" className="breadcrumbs-link">Главная</Link>
            <span className="breadcrumbs-sep">/</span>
            <span className="breadcrumbs-current">Мототехника</span>
          </div>
        </nav>

        <section className="catalog-filters">
          <div className="container">
            <div className="filters-card">
              <div className="filters-grid">
                <div className="filter-field">
                  <label>Цена $ от</label>
                  <input
                    type="number"
                    value={draftFilters.priceFromUsd}
                    onChange={(e) => setDraftFilters((s) => ({ ...s, priceFromUsd: e.target.value }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="filter-field">
                  <label>до</label>
                  <input
                    type="number"
                    value={draftFilters.priceToUsd}
                    onChange={(e) => setDraftFilters((s) => ({ ...s, priceToUsd: e.target.value }))}
                    placeholder="50000"
                    min="0"
                  />
                </div>
                <div className="filter-field">
                  <label>Марка</label>
                  <select
                    value={draftFilters.marka}
                    onChange={(e) =>
                      setDraftFilters((s) => ({
                        ...s,
                        marka: e.target.value,
                        model: '',
                      }))
                    }
                  >
                    <option value="">Любая</option>
                    {markas.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label>Модель</label>
                  <select
                    value={draftFilters.model}
                    onChange={(e) => setDraftFilters((s) => ({ ...s, model: e.target.value }))}
                    disabled={!modelsForSelectedMarka.length}
                  >
                    <option value="">Любая</option>
                    {modelsForSelectedMarka.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label>Тип</label>
                  <select
                    value={draftFilters.motoType}
                    onChange={(e) => setDraftFilters((s) => ({ ...s, motoType: e.target.value }))}
                  >
                    <option value="">Любой</option>
                    {motoTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label>Год от</label>
                  <select
                    value={draftFilters.yearFrom}
                    onChange={(e) => setDraftFilters((s) => ({ ...s, yearFrom: e.target.value }))}
                  >
                    <option value="">Любой</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label>до</label>
                  <select
                    value={draftFilters.yearTo}
                    onChange={(e) => setDraftFilters((s) => ({ ...s, yearTo: e.target.value }))}
                  >
                    <option value="">Любой</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-field filter-field-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={draftFilters.availableOnly}
                      onChange={(e) => setDraftFilters((s) => ({ ...s, availableOnly: e.target.checked }))}
                    />
                    Только в наличии
                  </label>
                </div>
                <div className="filters-actions">
                  <button type="button" className="btn-primary" onClick={applyFilters}>Показать мототехнику</button>
                  <button type="button" className="btn-outline" onClick={resetFilters}>Сбросить</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="motos-results" className="catalog-results">
          <div className="container">
            <div className="results-header">
              <h3>Найдено: {filteredMotos.length}</h3>
              {loading && <span className="results-muted">Загрузка…</span>}
              {errorText && <span className="results-error">{errorText}</span>}
            </div>

            <div className="catalog-grid">
              {!loading && filteredMotos.length === 0 && (
                <div className="results-empty">
                  Ничего не найдено по выбранным фильтрам.
                </div>
              )}

              {filteredMotos.map((m) => {
                const img = firstPhotoByMotoId.get(m.id) || null;
                const isFavorite = favoriteMotoIds.includes(m.id);
                return (
                  <Link
                    key={m.id}
                    to={`/motorcycles/${encodeURIComponent(m.slug)}`}
                    className="catalog-card catalog-card-link"
                  >
                    <div className="catalog-card-image">
                      <button
                        type="button"
                        className={`favorite-toggle-btn ${isFavorite ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(e, m.id)}
                        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                      >
                        {isFavorite ? '★' : '☆'}
                      </button>
                      {img ? (
                        <img src={img} alt={`${m.marka} ${m.moto_model}`} />
                      ) : (
                        <div className="catalog-card-placeholder">Нет фото</div>
                      )}
                      <div className="catalog-card-badge">{m.available ? 'В наличии' : 'Нет в наличии'}</div>
                    </div>
                    <div className="catalog-card-body">
                      <h4>{m.marka} {m.moto_model}</h4>
                      <div className="catalog-card-meta">
                        <span>{m.year} г.</span>
                        <span>{Number(m.mileage || 0).toLocaleString()} км</span>
                        {m.moto_type ? <span>{m.moto_type}</span> : null}
                        {m.engine_volume ? <span>{formatMotoEngineVolume(m.engine_volume)}</span> : null}
                      </div>
                      <div className="catalog-card-price">
                        <div className="price-byn">{m.price_byn ? `${Number(m.price_byn).toLocaleString()} BYN` : '—'}</div>
                        <div className="price-usd">{m.price_usd ? `$${Number(m.price_usd).toLocaleString()}` : ''}</div>
                      </div>
                      <span className="btn-outline">Подробнее</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

