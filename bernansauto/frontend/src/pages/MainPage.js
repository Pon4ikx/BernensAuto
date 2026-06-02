import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import { api } from '../api';
import '../styles/MainPage.css';

const DEFAULT_NEWS_IMAGE = `${process.env.PUBLIC_URL || ''}/news.png`;

const PRICE_FROM_OPTIONS = ['5000', '10000', '20000', '50000'];
const PRICE_TO_OPTIONS = ['20000', '50000', '100000', '150000'];

function resolveMediaUrl(url) {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `http://127.0.0.1:8000${path}`;
}

function formatNewsDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
}

function getNewsImageSrc(photo) {
    const media = resolveMediaUrl(photo);
    return media || DEFAULT_NEWS_IMAGE;
}

const MainPage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currencyRate, setCurrencyRate] = useState(2.5); // Пример курса BYN/USD
    const [popularCars, setPopularCars] = useState([]);
    const [popularMotos, setPopularMotos] = useState([]);
    const [carPhotos, setCarPhotos] = useState([]);
    const [motoPhotos, setMotoPhotos] = useState([]);
    const [catalogCars, setCatalogCars] = useState([]);
    const [latestNews, setLatestNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [quickFilters, setQuickFilters] = useState({
        priceFromUsd: '',
        priceToUsd: '',
        marka: '',
    });
    const location = useLocation();
    const navigate = useNavigate();

    // Данные для слайдера
    const slides = [
        {
            image: 'https://via.placeholder.com/1200x600.png?text=Slide+1',
            title: 'Премиальные автомобили',
            subtitle: 'Лучший выбор для взыскательных клиентов',
            catalogLink: '/cars',
        },
        {
            image: 'https://via.placeholder.com/1200x600.png?text=Slide+2',
            title: 'Выгодные условия',
            subtitle: 'Кредитование и трейд-ин',
            catalogLink: '/cars',
        },
        {
            image: 'https://via.placeholder.com/1200x600.png?text=Slide+3',
            title: 'Мототехника',
            subtitle: 'Мотоциклы и скутеры в наличии',
            catalogLink: '/motorcycles',
        }
    ];

    // Услуги
    const services = [
        { icon: '🚗', title: 'Продажа авто', description: 'Широкий выбор новых и подержанных автомобилей' },
        { icon: '💰', title: 'Кредитование', description: 'Выгодные условия автокредита' },
        { icon: '🔄', title: 'Трейд-ин', description: 'Обмен вашего авто на новый' },
        { icon: '🏍️', title: 'Мототехника', description: 'Мотоциклы, скутеры, квадроциклы' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    useEffect(() => {
        let isMounted = true;
        const loadPopular = async () => {
            try {
                const [carsRes, motosRes, carPhotosRes, motoPhotosRes] = await Promise.all([
                    api.get('cars/popular/cars/').catch(() => ({ data: [] })),
                    api.get('cars/popular/motorcycles/').catch(() => ({ data: [] })),
                    api.get('cars/car-photos/').catch(() => ({ data: [] })),
                    api.get('cars/moto-photos/').catch(() => ({ data: [] })),
                ]);
                if (!isMounted) return;
                setPopularCars(Array.isArray(carsRes.data) ? carsRes.data : []);
                setPopularMotos(Array.isArray(motosRes.data) ? motosRes.data : []);
                setCarPhotos(Array.isArray(carPhotosRes.data) ? carPhotosRes.data : []);
                setMotoPhotos(Array.isArray(motoPhotosRes.data) ? motoPhotosRes.data : []);
            } catch (e) {
                // silently ignore; page will just show empty blocks
            }
        };
        loadPopular();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadExtras = async () => {
            try {
                const [carsRes, newsRes, meRes] = await Promise.all([
                    api.get('cars/').catch(() => ({ data: [] })),
                    api.get('content/news/').catch(() => ({ data: [] })),
                    api.get('accounts/me/').catch(() => null),
                ]);
                if (!isMounted) return;
                setCatalogCars(Array.isArray(carsRes.data) ? carsRes.data : []);
                const allNews = Array.isArray(newsRes.data) ? newsRes.data : [];
                setLatestNews(allNews.slice(0, 3));
                setIsAuthenticated(Boolean(meRes?.data?.id));
            } catch (e) {
                // ignore
            } finally {
                if (isMounted) setNewsLoading(false);
            }
        };
        loadExtras();
        return () => { isMounted = false; };
    }, []);

    const quickSearchMarkas = useMemo(() => {
        const set = new Set();
        for (const c of catalogCars) {
            if (c?.marka) set.add(c.marka);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
    }, [catalogCars]);

    const firstCarPhotoById = useMemo(() => {
        const map = new Map();
        for (const p of carPhotos) {
            const carId = p?.car;
            const url = resolveMediaUrl(p?.photo);
            if (!carId || !url) continue;
            if (!map.has(carId)) map.set(carId, url);
        }
        return map;
    }, [carPhotos]);

    const firstMotoPhotoById = useMemo(() => {
        const map = new Map();
        for (const p of motoPhotos) {
            const motoId = p?.motorcycle;
            const url = resolveMediaUrl(p?.photo);
            if (!motoId || !url) continue;
            if (!map.has(motoId)) map.set(motoId, url);
        }
        return map;
    }, [motoPhotos]);

    // Если перешли на главную по ссылке вида "/#services" — аккуратно скроллим к секции.
    useEffect(() => {
        if (!location.hash) return;
        const id = location.hash.replace('#', '');
        if (!id) return;
        // небольшой таймаут, чтобы DOM успел отрисоваться
        const t = setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
        return () => clearTimeout(t);
    }, [location.hash]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    const openAuthPanel = () => {
        window.dispatchEvent(new CustomEvent('open-auth-panel', { detail: { tab: 'login' } }));
    };

    const handleQuickSearch = () => {
        const params = new URLSearchParams();
        if (quickFilters.priceFromUsd) params.set('priceFrom', quickFilters.priceFromUsd);
        if (quickFilters.priceToUsd) params.set('priceTo', quickFilters.priceToUsd);
        if (quickFilters.marka) params.set('marka', quickFilters.marka);
        const qs = params.toString();
        navigate(qs ? `/cars?${qs}` : '/cars');
    };

    const handleQuickEvaluation = async () => {
        if (isAuthenticated) {
            navigate('/profile', { state: { tab: 'onlineEvaluation' } });
            return;
        }
        try {
            const meRes = await api.get('accounts/me/');
            if (meRes?.data?.id) {
                setIsAuthenticated(true);
                navigate('/profile', { state: { tab: 'onlineEvaluation' } });
                return;
            }
        } catch {
            // not logged in
        }
        openAuthPanel();
    };

    const handleNewsImageError = (event) => {
        const img = event.currentTarget;
        if (img.dataset.fallbackApplied === '1') return;
        img.dataset.fallbackApplied = '1';
        img.src = DEFAULT_NEWS_IMAGE;
    };

    const formatPrice = (price) => {
        const bynPrice = (price / currencyRate).toFixed(0);
        return {
            byn: `${bynPrice} BYN`,
            usd: `$${(price / 40).toFixed(0)}` // оставляем USD для примера
        };
    };

    return (
        <div className="main-page">
            <SiteHeader />

            {/* Hero Slider */}
            <section className="hero-slider">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${slide.image})` }}
                    >
                        <div className="slide-content">
                            <h2>{slide.title}</h2>
                            <p>{slide.subtitle}</p>
                            <div className="slider-buttons">
                                <Link to={slide.catalogLink} className="btn-secondary">Посмотреть каталог</Link>
                            </div>
                        </div>
                    </div>
                ))}

                <button className="slider-nav prev" onClick={prevSlide}>‹</button>
                <button className="slider-nav next" onClick={nextSlide}>›</button>

                <div className="slider-dots">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(index)}
                        />
                    ))}
                </div>
            </section>

            {/* Подбор автомобилей (как на Golden Motors) */}
            <section className="quick-search">
                <div className="container">
                    <h2>Подбор автомобилей</h2>
                    <div className="search-filters">
                        <div className="search-filters-fields">
                            <select
                                value={quickFilters.priceFromUsd}
                                onChange={(e) => setQuickFilters((s) => ({ ...s, priceFromUsd: e.target.value }))}
                                aria-label="Цена от, USD"
                            >
                                <option value="">Цена $ от</option>
                                {PRICE_FROM_OPTIONS.map((v) => (
                                    <option key={v} value={v}>{Number(v).toLocaleString('ru-RU')}</option>
                                ))}
                            </select>
                            <select
                                value={quickFilters.priceToUsd}
                                onChange={(e) => setQuickFilters((s) => ({ ...s, priceToUsd: e.target.value }))}
                                aria-label="Цена до, USD"
                            >
                                <option value="">до</option>
                                {PRICE_TO_OPTIONS.map((v) => (
                                    <option key={v} value={v}>{Number(v).toLocaleString('ru-RU')}</option>
                                ))}
                            </select>
                            <select
                                value={quickFilters.marka}
                                onChange={(e) => setQuickFilters((s) => ({ ...s, marka: e.target.value }))}
                                aria-label="Марка авто"
                            >
                                <option value="">Марка авто</option>
                                {quickSearchMarkas.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="search-filters-submit">
                            <button type="button" className="btn-primary" onClick={handleQuickSearch}>Показать авто</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Автомобили — блок каталога */}
            <section id="cars" className="featured-cars">
                <div className="container">
                    <h2>Популярные автомобили</h2>
                    <div className="cars-grid">
                        {popularCars.map((car) => {
                            const img = firstCarPhotoById.get(car.id);
                            return (
                                <div key={car.id} className="car-card">
                                    <div className="car-image">
                                        {img ? (
                                            <img src={img} alt={`${car.marka} ${car.car_model}`} />
                                        ) : (
                                            <div className="catalog-card-placeholder">Нет фото</div>
                                        )}
                                        <div className="car-badge">{car.available ? 'В наличии' : 'Нет в наличии'}</div>
                                    </div>
                                    <div className="car-info">
                                        <h3>{car.marka} {car.car_model}</h3>
                                        <div className="car-details">
                                            <span>{car.year} год</span>
                                            <span>{Number(car.mileage || 0).toLocaleString()} км</span>
                                            <span>{car.body_type || '—'}</span>
                                        </div>
                                        <div className="car-price">
                                            <div className="price-byn">{car.price_byn ? `${Number(car.price_byn).toLocaleString()} BYN` : '—'}</div>
                                            <div className="price-usd">{car.price_usd ? `$${Number(car.price_usd).toLocaleString()}` : ''}</div>
                                        </div>
                                        <Link to={`/cars/${encodeURIComponent(car.slug)}`} className="btn-outline">Подробнее</Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="section-footer">
                        <Link to="/cars" className="btn-primary">Перейти в каталог</Link>
                    </div>
                </div>
            </section>

            {/* Мототехника — второй блок как на Golden Motors */}
            <section id="motorcycles" className="featured-motos">
                <div className="container">
                    <h2>Подбор мототехники</h2>
                    <div className="motos-grid">
                        {popularMotos.map((moto) => {
                            const img = firstMotoPhotoById.get(moto.id);
                            return (
                                <div key={moto.id} className="moto-card">
                                    <div className="moto-image">
                                        {img ? (
                                            <img src={img} alt={`${moto.marka} ${moto.moto_model}`} />
                                        ) : (
                                            <div className="catalog-card-placeholder">Нет фото</div>
                                        )}
                                        <div className="moto-badge">{moto.available ? 'В наличии' : 'Нет в наличии'}</div>
                                    </div>
                                    <div className="moto-info">
                                        <h3>{moto.marka} {moto.moto_model}</h3>
                                        <div className="moto-details">
                                            <span>{moto.year} г.</span>
                                            <span>{Number(moto.mileage || 0).toLocaleString()} км</span>
                                        </div>
                                        <div className="moto-price">
                                            <div className="price-byn">{moto.price_byn ? `${Number(moto.price_byn).toLocaleString()} BYN` : '—'}</div>
                                            <div className="price-usd">{moto.price_usd ? `$${Number(moto.price_usd).toLocaleString()}` : ''}</div>
                                        </div>
                                        <Link to={`/motorcycles/${encodeURIComponent(moto.slug)}`} className="btn-outline">Подробнее</Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="section-footer">
                        <Link to="/motorcycles" className="btn-primary">Перейти в каталог</Link>
                    </div>
                </div>
            </section>

            {/* Услуги — «Что мы предлагаем» в стиле Golden Motors */}
            <section id="services" className="services">
                <div className="container">
                    <h2>Что мы предлагаем</h2>
                    <div className="services-grid">
                        {services.map((service, index) => (
                            <div key={index} className="service-card">
                                <div className="service-icon">{service.icon}</div>
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                            </div>
                        ))}
                    </div>
                    <div className="section-footer">
                        <Link to="/services" className="btn-primary">Все услуги</Link>
                    </div>
                </div>
            </section>

            {/* Новости (якорь для ссылки из хедера) */}
            <section id="news" className="services home-news-section">
                <div className="container">
                    <h2>Новости</h2>
                    {newsLoading && <p className="home-news-muted">Загрузка…</p>}
                    {!newsLoading && latestNews.length === 0 && (
                        <p className="home-news-muted">Новостей пока нет.</p>
                    )}
                    {!newsLoading && latestNews.length > 0 && (
                        <div className="home-news-grid">
                            {latestNews.map((item) => (
                                <article key={item.id} className="home-news-card">
                                    <div className="home-news-card-image-wrap">
                                        <img
                                            src={getNewsImageSrc(item.photo)}
                                            alt={item.title || 'Новость'}
                                            className="home-news-card-image"
                                            onError={handleNewsImageError}
                                        />
                                    </div>
                                    <div className="home-news-card-body">
                                        <time className="home-news-card-date" dateTime={item.published_at}>
                                            {formatNewsDate(item.published_at)}
                                        </time>
                                        <h3>{item.title}</h3>
                                        <p>{item.text}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    <div className="section-footer">
                        <Link to="/news" className="btn-primary">Все новости</Link>
                    </div>
                </div>
            </section>

            {/* Призыв к действию (выкуп / комиссия) */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Хотите продать автомобиль или мотоцикл?</h2>
                        <p>Выкуп до 90% рыночной цены, комиссионная продажа и Trade-in. Деньги сразу.</p>
                        <div className="cta-buttons">
                            <button type="button" className="btn-secondary" onClick={handleQuickEvaluation}>
                                Быстрая оценка
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contacts" className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>Bernans Auto</h3>
                            <p>Лучший выбор автомобилей и мототехники с 2010 года</p>
                        </div>
                        <div className="footer-section">
                            <h4>Контакты</h4>
                            <p>📞 +375 (XX) XXX-XX-XX</p>
                            <p>📧 bernansauto@gmail.com</p>
                            <p>📍 г. Минск, ул. Примерная, 123</p>
                        </div>
                        <div className="footer-section">
                            <h4>Часы работы</h4>
                            <p>Пн-Пт: 9:00 - 19:00</p>
                            <p>Сб-Вс: 10:00 - 17:00</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2025 Bernans Auto. Все права защищены.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainPage;
