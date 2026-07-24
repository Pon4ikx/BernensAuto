import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import Breadcrumbs from '../components/Breadcrumbs';
import { api } from '../api';
import {
  formatNewsDate,
  getNewsImageSrc,
  handleNewsImageError,
} from '../utils/news';
import '../styles/NewsPage.css';

export default function NewsDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setErrorText('');
        const res = await api.get(`content/news/${encodeURIComponent(id)}/`);
        if (!isMounted) return;
        setItem(res.data);
      } catch {
        if (!isMounted) return;
        setItem(null);
        setErrorText('Не удалось загрузить новость. Возможно, она была удалена.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const img = item ? getNewsImageSrc(item.photo) : null;
  const alt = item?.title || 'Новость Bernans Auto';

  return (
    <div className="news-page">
      <SiteHeader />
      <main className="news-main">
        <Breadcrumbs
          lead
          items={[
            { to: '/', label: 'Главная' },
            { to: '/news', label: 'Новости' },
            { label: item?.title || 'Новость' },
          ]}
        />
        <div className="container">
          {loading && <div className="news-muted">Загрузка…</div>}
          {errorText && <div className="news-error">{errorText}</div>}

          {!loading && !errorText && item && (
            <article className="news-detail">
              <header className="news-detail-header">
                <time className="news-detail-date" dateTime={item.published_at}>
                  {formatNewsDate(item.published_at, { withTime: true })}
                </time>
                <h1 className="news-detail-title">{item.title}</h1>
              </header>

              {img && (
                <div className="news-detail-image-wrap">
                  <img
                    src={img}
                    alt={alt}
                    className="news-detail-image"
                    onError={handleNewsImageError}
                  />
                </div>
              )}

              <div className="news-detail-text">{item.text}</div>

              <div className="news-detail-actions">
                <Link to="/news" className="news-detail-back">
                  ← Все новости
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
