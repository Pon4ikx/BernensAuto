import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../styles/MainPage.css';
import '../styles/CarsPage.css';
import '../styles/Breadcrumbs.css';
import SiteHeader from '../components/SiteHeader';

function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://127.0.0.1:8000${url}`;
}

export default function CarDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
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

        const carRes = await api.get(`cars/${encodeURIComponent(slug)}/`);
        if (!isMounted) return;
        setCar(carRes.data);

        const photosRes = await api.get('cars/car-photos/').catch(() => ({ data: [] }));
        if (!isMounted) return;
        const carId = carRes.data.id;
        const all = Array.isArray(photosRes.data) ? photosRes.data.filter((p) => p.car === carId) : [];
        setPhotos(all);
        setActivePhotoIndex(0);

        const meRes = await api.get('accounts/me/').catch(() => null);
        const isAuth = Boolean(meRes?.data?.id);
        setIsAuthenticated(isAuth);
        if (isAuth) {
          const favoritesRes = await api.get('cars/car-favorites/').catch(() => ({ data: [] }));
          const ids = Array.isArray(favoritesRes.data) ? favoritesRes.data.map((item) => item.car) : [];
          setIsFavorite(ids.includes(carId));
        } else {
          setIsFavorite(false);
        }
      } catch (err) {
        if (!isMounted) return;
        setErrorText('Не удалось загрузить автомобиль. Возможно, он был удалён или изменён slug.');
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
    if (!car) return;
    navigate(`/request-car/${car.id}`);
  };

  const toggleFavorite = async () => {
    if (!car) return;
    if (!isAuthenticated) {
      openAuthPanel();
      return;
    }
    try {
      const { data } = await api.post('cars/favorites/car/toggle/', { car_id: car.id });
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
            <h2>Автомобиль</h2>
            <p>Подробная информация об автомобиле.</p>
          </div>
        </section>

        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <div className="container breadcrumbs-inner">
            <Link to="/" className="breadcrumbs-link">Главная</Link>
            <span className="breadcrumbs-sep">/</span>
            <Link to="/cars" className="breadcrumbs-link">Автомобили</Link>
            <span className="breadcrumbs-sep">/</span>
            <span className="breadcrumbs-current">
              {car ? `${car.marka} ${car.car_model}` : 'Загрузка...'}
            </span>
          </div>
        </nav>

        <section className="catalog-results catalog-results-detail">
          <div className="container">
            {loading && <div className="results-muted">Загрузка…</div>}
            {errorText && <div className="results-error">{errorText}</div>}

            {car && (
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
                            alt={`${car.marka} ${car.car_model}`}
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
                    <h3>{car.marka} {car.car_model}</h3>
                    <div className="car-detail-subtitle">
                      {car.year} г., {car.body_type || 'кузов не указан'}, пробег {Number(car.mileage || 0).toLocaleString()} км
                    </div>

                    <div className="car-detail-price-block">
                      <div className="car-detail-price-main">
                        {car.price_byn ? `${Number(car.price_byn).toLocaleString()} BYN` : 'Цена по запросу'}
                      </div>
                      {car.price_usd && (
                        <div className="car-detail-price-secondary">
                          ≈ ${Number(car.price_usd).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="car-detail-specs">
                      <div>
                        <div className="car-detail-spec-label">Год выпуска</div>
                        <div className="car-detail-spec-value">{car.year}</div>
                      </div>
                      <div>
                        <div className="car-detail-spec-label">Пробег</div>
                        <div className="car-detail-spec-value">{Number(car.mileage || 0).toLocaleString()} км</div>
                      </div>
                      {car.engine_type && (
                        <div>
                          <div className="car-detail-spec-label">Двигатель</div>
                          <div className="car-detail-spec-value">{car.engine_type}</div>
                        </div>
                      )}
                      {car.engine_volume && (
                        <div>
                          <div className="car-detail-spec-label">Объём двигателя</div>
                          <div className="car-detail-spec-value">{Number(car.engine_volume)} л</div>
                        </div>
                      )}
                      {car.transmission && (
                        <div>
                          <div className="car-detail-spec-label">Трансмиссия</div>
                          <div className="car-detail-spec-value">{car.transmission}</div>
                        </div>
                      )}
                      {car.drive_type && (
                        <div>
                          <div className="car-detail-spec-label">Привод</div>
                          <div className="car-detail-spec-value">{car.drive_type}</div>
                        </div>
                      )}
                      {car.color && (
                        <div>
                          <div className="car-detail-spec-label">Цвет</div>
                          <div className="car-detail-spec-value">{car.color}</div>
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

                {car.description && (
                  <div className="car-detail-description" style={{ marginTop: '1.75rem' }}>
                    <h4>Описание</h4>
                    <p>{car.description}</p>
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

