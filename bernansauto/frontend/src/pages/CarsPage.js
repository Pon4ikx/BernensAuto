import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import '../styles/MainPage.css';
import '../styles/CarsPage.css';
import '../styles/Breadcrumbs.css';
import SiteHeader from '../components/SiteHeader';

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // DRF обычно отдаёт относительный путь вида /media/...
  return `http://127.0.0.1:8000${url}`;
}

function filtersFromSearchParams(searchParams) {
  return {
    priceFromUsd: searchParams.get('priceFrom') || '',
    priceToUsd: searchParams.get('priceTo') || '',
    marka: searchParams.get('marka') || '',
    model: searchParams.get('model') || '',
    yearFrom: searchParams.get('yearFrom') || '',
    yearTo: searchParams.get('yearTo') || '',
    availableOnly: searchParams.get('availableOnly') !== '0',
  };
}

export default function CarsPage() {
  const [searchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [carPhotos, setCarPhotos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [favoriteCarIds, setFavoriteCarIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const [draftFilters, setDraftFilters] = useState({
    priceFromUsd: '',
    priceToUsd: '',
    marka: '',
    model: '',
    yearFrom: '',
    yearTo: '',
    availableOnly: true,
  });

  const [appliedFilters, setAppliedFilters] = useState(draftFilters);

  useEffect(() => {
    if (!searchParams.toString()) return;
    const fromUrl = filtersFromSearchParams(searchParams);
    setDraftFilters(fromUrl);
    setAppliedFilters(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setErrorText('');

        const [carsRes, photosRes, meRes, favoritesRes] = await Promise.all([
          api.get('cars/'),
          api.get('cars/car-photos/').catch(() => ({ data: [] })), // если фото не настроены — просто пропускаем
          api.get('accounts/me/').catch(() => null),
          api.get('cars/car-favorites/').catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;
        setCars(Array.isArray(carsRes.data) ? carsRes.data : []);
        setCarPhotos(Array.isArray(photosRes.data) ? photosRes.data : []);
        setIsAuthenticated(Boolean(meRes?.data?.id));
        const ids = Array.isArray(favoritesRes.data) ? favoritesRes.data.map((item) => item.car) : [];
        setFavoriteCarIds(ids);
      } catch (err) {
        if (!isMounted) return;
        setErrorText('Не удалось загрузить автомобили. Проверь, что бэкенд запущен на http://127.0.0.1:8000');
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
    for (const c of cars) {
      if (c?.marka) set.add(c.marka);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [cars]);

  const modelsForSelectedMarka = useMemo(() => {
    const set = new Set();
    for (const c of cars) {
      if (!c) continue;
      if (draftFilters.marka && c.marka !== draftFilters.marka) continue;
      if (c.car_model) set.add(c.car_model);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [cars, draftFilters.marka]);

  const years = useMemo(() => {
    const set = new Set();
    for (const c of cars) {
      if (typeof c?.year === 'number') set.add(c.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [cars]);

  const firstPhotoByCarId = useMemo(() => {
    const map = new Map();
    for (const p of carPhotos) {
      const carId = p?.car;
      const url = resolveMediaUrl(p?.photo);
      if (!carId || !url) continue;
      if (!map.has(carId)) map.set(carId, url);
    }
    return map;
  }, [carPhotos]);

  const filteredCars = useMemo(() => {
    const priceFrom = toNumber(appliedFilters.priceFromUsd);
    const priceTo = toNumber(appliedFilters.priceToUsd);
    const yearFrom = toNumber(appliedFilters.yearFrom);
    const yearTo = toNumber(appliedFilters.yearTo);

    return cars.filter((c) => {
      if (!c) return false;

      if (appliedFilters.availableOnly && c.available === false) return false;

      if (appliedFilters.marka && c.marka !== appliedFilters.marka) return false;
      if (appliedFilters.model && c.car_model !== appliedFilters.model) return false;

      if (yearFrom !== null && Number(c.year) < yearFrom) return false;
      if (yearTo !== null && Number(c.year) > yearTo) return false;

      const priceUsd = c.price_usd !== null && c.price_usd !== undefined ? Number(c.price_usd) : null;
      if (priceFrom !== null && (priceUsd === null || priceUsd < priceFrom)) return false;
      if (priceTo !== null && (priceUsd === null || priceUsd > priceTo)) return false;

      return true;
    });
  }, [cars, appliedFilters]);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    const el = document.getElementById('cars-results');
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
      availableOnly: true,
    };
    setDraftFilters(base);
    setAppliedFilters(base);
  };

  const openAuthPanel = () => {
    window.dispatchEvent(new CustomEvent('open-auth-panel', { detail: { tab: 'login' } }));
  };

  const toggleFavorite = async (event, carId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      openAuthPanel();
      return;
    }

    try {
      const { data } = await api.post('cars/favorites/car/toggle/', { car_id: carId });
      setFavoriteCarIds((prev) => {
        const has = prev.includes(carId);
        if (data?.is_favorite && !has) return [...prev, carId];
        if (!data?.is_favorite && has) return prev.filter((id) => id !== carId);
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
            <h2>Автомобили</h2>
            <p>Каталог автомобилей с фильтром как на Golden Motors.</p>
          </div>
        </section>

        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <div className="container breadcrumbs-inner">
            <Link to="/" className="breadcrumbs-link">Главная</Link>
            <span className="breadcrumbs-sep">/</span>
            <span className="breadcrumbs-current">Автомобили</span>
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
                    placeholder="100000"
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
                  <button type="button" className="btn-primary" onClick={applyFilters}>Показать авто</button>
                  <button type="button" className="btn-outline" onClick={resetFilters}>Сбросить</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cars-results" className="catalog-results">
          <div className="container">
            <div className="results-header">
              <h3>Найдено: {filteredCars.length}</h3>
              {loading && <span className="results-muted">Загрузка…</span>}
              {errorText && <span className="results-error">{errorText}</span>}
            </div>

            <div className="catalog-grid">
              {!loading && filteredCars.length === 0 && (
                <div className="results-empty">
                  Ничего не найдено по выбранным фильтрам.
                </div>
              )}

              {filteredCars.map((c) => {
                const img = firstPhotoByCarId.get(c.id) || null;
                const isFavorite = favoriteCarIds.includes(c.id);
                return (
                  <Link
                    key={c.id}
                    to={`/cars/${encodeURIComponent(c.slug)}`}
                    className="catalog-card catalog-card-link"
                  >
                    <div className="catalog-card-image">
                      <button
                        type="button"
                        className={`favorite-toggle-btn ${isFavorite ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(e, c.id)}
                        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                      >
                        {isFavorite ? '★' : '☆'}
                      </button>
                      {img ? (
                        <img src={img} alt={`${c.marka} ${c.car_model}`} />
                      ) : (
                        <div className="catalog-card-placeholder">Нет фото</div>
                      )}
                      <div className="catalog-card-badge">{c.available ? 'В наличии' : 'Нет в наличии'}</div>
                    </div>
                    <div className="catalog-card-body">
                      <h4>{c.marka} {c.car_model}</h4>
                      <div className="catalog-card-meta">
                        <span>{c.year} г.</span>
                        <span>{Number(c.mileage || 0).toLocaleString()} км</span>
                        {c.body_type ? <span>{c.body_type}</span> : null}
                        {c.transmission ? <span>{c.transmission}</span> : null}
                      </div>
                      <div className="catalog-card-price">
                        <div className="price-byn">{c.price_byn ? `${Number(c.price_byn).toLocaleString()} BYN` : '—'}</div>
                        <div className="price-usd">{c.price_usd ? `$${Number(c.price_usd).toLocaleString()}` : ''}</div>
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
    </div>
  );
}

