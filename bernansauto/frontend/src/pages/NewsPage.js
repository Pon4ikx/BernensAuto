import React, { useEffect, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import Breadcrumbs from '../components/Breadcrumbs';
import { api } from '../api';
import '../styles/NewsPage.css';

const DEFAULT_NEWS_IMAGE = `${process.env.PUBLIC_URL || ''}/news.png`;

function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `http://127.0.0.1:8000${path}`;
}

function getNewsImageSrc(photo) {
  const media = resolveMediaUrl(photo);
  return media || DEFAULT_NEWS_IMAGE;
}

function handleNewsImageError(event) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = DEFAULT_NEWS_IMAGE;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

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
                return (
                  <article key={n.id} className="news-card">
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
                        {formatDate(n.published_at)}
                      </time>
                      <h2 className="news-card-title">{n.title}</h2>
                      <div className="news-card-text">{n.text}</div>
                    </div>
                  </article>
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
