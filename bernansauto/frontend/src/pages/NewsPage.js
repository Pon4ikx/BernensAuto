import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import Breadcrumbs from '../components/Breadcrumbs';
import { api } from '../api';
import {
  excerptNewsText,
  formatNewsDate,
  getNewsImageSrc,
  handleNewsImageError,
} from '../utils/news';
import '../styles/NewsPage.css';

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setErrorText('');
        const res = await api.get('content/news/');
        if (!isMounted) return;
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!isMounted) return;
        setErrorText('Не удалось загрузить новости. Проверьте, что бэкенд запущен.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="news-page">
      <SiteHeader />
      <main className="news-main">
        <Breadcrumbs
          lead
          items={[
            { to: '/', label: 'Главная' },
            { label: 'Новости' },
          ]}
        />
        <div className="container">
          <div className="news-hero">
            <h1>Новости</h1>
            <p>Актуальные события и объявления Bernans Auto.</p>
          </div>

          {loading && <div className="news-muted">Загрузка…</div>}
          {errorText && <div className="news-error">{errorText}</div>}

          {!loading && !errorText && items.length === 0 && (
            <div className="news-muted">Новостей пока нет. Добавьте записи в админ-панели.</div>
          )}

          {!loading && !errorText && items.length > 0 && (
            <div className="news-list">
              {items.map((n) => {
                const img = getNewsImageSrc(n.photo);
                const alt = n.title || 'Новость Bernans Auto';
                const preview = excerptNewsText(n.text);
                return (
                  <Link key={n.id} to={`/news/${n.id}`} className="news-card news-card-link">
                    <div className="news-card-image-wrap">
                      <img
                        src={img}
                        alt={alt}
                        className="news-card-image"
                        onError={handleNewsImageError}
                      />
                    </div>
                    <div className="news-card-body">
                      <time className="news-card-date" dateTime={n.published_at}>
                        {formatNewsDate(n.published_at, { withTime: true })}
                      </time>
                      <h2 className="news-card-title">{n.title}</h2>
                      <p className="news-card-text">{preview}</p>
                      <span className="news-card-more">Читать далее</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
