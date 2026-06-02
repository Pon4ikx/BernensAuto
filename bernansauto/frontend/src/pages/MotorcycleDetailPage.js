import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../styles/MainPage.css';
import '../styles/CarsPage.css';
import '../styles/Breadcrumbs.css';
import SiteHeader from '../components/SiteHeader';
import { formatMotoEngineVolume } from '../utils/motoFormat';

function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://127.0.0.1:8000${url}`;
}

export default function MotorcycleDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [moto, setMoto] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setErrorText('');

        const motoRes = await api.get(`cars/motorcycles/${encodeURIComponent(slug)}/`);
        if (!isMounted) return;
        setMoto(motoRes.data);

        const photosRes = await api.get('cars/moto-photos/').catch(() => ({ data: [] }));
        if (!isMounted) return;
        const motoId = motoRes.data.id;
        const all = Array.isArray(photosRes.data) ? photosRes.data.filter((p) => p.motorcycle === motoId) : [];
        setPhotos(all);
        setActivePhotoIndex(0);

        const meRes = await api.get('accounts/me/').catch(() => null);
        const isAuth = Boolean(meRes?.data?.id);
        setIsAuthenticated(isAuth);
        if (isAuth) {
          const favoritesRes = await api.get('cars/moto-favorites/').catch(() => ({ data: [] }));
          const ids = Array.isArray(favoritesRes.data) ? favoritesRes.data.map((item) => item.motorcycle) : [];
          setIsFavorite(ids.includes(motoId));
        } else {
          setIsFavorite(false);
        }
      } catch (err) {
        if (!isMounted) return;
        setErrorText('Не удалось загрузить мототехнику. Возможно, она была удалена или изменён slug.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const openAuthPanel = () => {
    window.dispatchEvent(new CustomEvent('open-auth-panel', { detail: { tab: 'login' } }));
  };

  const handleApplication = () => {
    if (!moto) return;
    navigate(`/request-moto/${moto.id}`);
  };

  const toggleFavorite = async () => {
    if (!moto) return;
    if (!isAuthenticated) {
      openAuthPanel();
      return;
    }
    try {
      const { data } = await api.post('cars/favorites/moto/toggle/', { motorcycle_id: moto.id });
      setIsFavorite(Boolean(data?.is_favorite));
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
            <p>Подробная информация о выбранной мототехнике.</p>
          </div>
        </section>

        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <div className="container breadcrumbs-inner">
            <Link to="/" className="breadcrumbs-link">Главная</Link>
            <span className="breadcrumbs-sep">/</span>
            <Link to="/motorcycles" className="breadcrumbs-link">Мототехника</Link>
            <span className="breadcrumbs-sep">/</span>
            <span className="breadcrumbs-current">
              {moto ? `${moto.marka} ${moto.moto_model}` : 'Загрузка...'}
            </span>
          </div>
        </nav>

        <section className="catalog-results catalog-results-detail">
          <div className="container">
            {loading && <div className="results-muted">Загрузка…</div>}
            {errorText && <div className="results-error">{errorText}</div>}

            {moto && (
              <div className="car-detail">
                <div className="car-detail-main">
                  <div className="car-detail-gallery">
                    {photos.length > 0 ? (
                      <>
                        <div className="car-detail-photo-main">
                          {photos.length > 1 && (
                            <>
                              <button
                                type="button"
                                className="car-detail-photo-nav prev"
                                onClick={() =>
                                  setActivePhotoIndex((prev) =>
                                    prev === 0 ? photos.length - 1 : prev - 1
                                  )
                                }
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className="car-detail-photo-nav next"
                                onClick={() =>
                                  setActivePhotoIndex((prev) =>
                                    prev === photos.length - 1 ? 0 : prev + 1
                                  )
                                }
                              >
                                ›
                              </button>
                            </>
                          )}
                          <img
                            src={resolveMediaUrl(photos[activePhotoIndex].photo)}
                            alt={`${moto.marka} ${moto.moto_model}`}
                          />
                        </div>
                        {photos.length > 1 && (
                          <div className="car-detail-photo-thumbs">
                            {photos.map((p, idx) => (
                              <img
                                key={p.id}
                                src={resolveMediaUrl(p.photo)}
                                alt=""
                                onClick={() => setActivePhotoIndex(idx)}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="catalog-card-placeholder">Нет фото</div>
                    )}
                  </div>

                  <div className="car-detail-info">
                    <h3>{moto.marka} {moto.moto_model}</h3>
                    <div className="car-detail-subtitle">
                      {moto.year} г., {moto.moto_type || 'тип не указан'}, пробег {Number(moto.mileage || 0).toLocaleString()} км
                    </div>

                    <div className="car-detail-price-block">
                      <div className="car-detail-price-main">
                        {moto.price_byn ? `${Number(moto.price_byn).toLocaleString()} BYN` : 'Цена по запросу'}
                      </div>
                      {moto.price_usd && (
                        <div className="car-detail-price-secondary">
                          ≈ ${Number(moto.price_usd).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="car-detail-specs">
                      <div>
                        <div className="car-detail-spec-label">Год выпуска</div>
                        <div className="car-detail-spec-value">{moto.year}</div>
                      </div>
                      <div>
                        <div className="car-detail-spec-label">Пробег</div>
                        <div className="car-detail-spec-value">{Number(moto.mileage || 0).toLocaleString()} км</div>
                      </div>
                      {moto.moto_type && (
                        <div>
                          <div className="car-detail-spec-label">Тип</div>
                          <div className="car-detail-spec-value">{moto.moto_type}</div>
                        </div>
                      )}
                      {moto.engine_type && (
                        <div>
                          <div className="car-detail-spec-label">Двигатель</div>
                          <div className="car-detail-spec-value">{moto.engine_type}</div>
                        </div>
                      )}
                      {moto.engine_volume && (
                        <div>
                          <div className="car-detail-spec-label">Объём двигателя</div>
                          <div className="car-detail-spec-value">{formatMotoEngineVolume(moto.engine_volume)}</div>
                        </div>
                      )}
                    </div>

                    <div className="car-detail-actions">
                      <button type="button" className="btn-primary" onClick={handleApplication}>
                        Оставить заявку
                      </button>
                      <button
                        type="button"
                        className={`btn-outline detail-favorite-btn ${isFavorite ? 'active' : ''}`}
                        onClick={toggleFavorite}
                      >
                        <span className="detail-favorite-icon">{isFavorite ? '★' : '☆'}</span>
                        <span className="detail-favorite-label">{isFavorite ? 'В избранном' : 'В избранное'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {moto.description && (
                  <div className="car-detail-description" style={{ marginTop: '1.75rem' }}>
                    <h4>Описание</h4>
                    <p>{moto.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

