import React, { useEffect, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import Breadcrumbs from '../components/Breadcrumbs';
import { api } from '../api';
import '../styles/ServicesPage.css';

function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://127.0.0.1:8000${url}`;
}

function ServiceIcon({ icon }) {
  if (!icon) return <span className="services-icon-fallback" aria-hidden="true">✦</span>;
  if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/')) {
    const src = resolveMediaUrl(icon.startsWith('/') ? icon : icon);
    return <img src={src} alt="" className="services-icon-img" />;
  }
  return <span className="services-icon-emoji" aria-hidden="true">{icon}</span>;
}

export default function ServicesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setErrorText('');
        const res = await api.get('services/items/');
        if (!isMounted) return;
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!isMounted) return;
        setErrorText('Не удалось загрузить услуги. Проверьте, что бэкенд запущен.');
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
    <div className="services-page">
      <SiteHeader />
      <main className="services-main">
        <Breadcrumbs
          lead
          items={[
            { to: '/', label: 'Главная' },
            { label: 'Услуги' },
          ]}
        />
        <div className="container">
          <div className="services-hero">
            <h1>Услуги</h1>
            <p>Чем мы можем помочь: подбор, оформление, сопровождение сделки и другое.</p>
          </div>

          {loading && <div className="services-muted">Загрузка…</div>}
          {errorText && <div className="services-error">{errorText}</div>}

          {!loading && !errorText && items.length === 0 && (
            <div className="services-muted">Услуги пока не заполнены в админ-панели.</div>
          )}

          {!loading && !errorText && items.length > 0 && (
            <div className="services-grid-page">
              {items.map((s) => (
                <article key={s.id} className="services-card-page">
                  <div className="services-card-icon">
                    <ServiceIcon icon={s.icon} />
                  </div>
                  <h2 className="services-card-title">{s.title}</h2>
                  {s.description ? (
                    <p className="services-card-desc">{s.description}</p>
                  ) : (
                    <p className="services-muted">Описание уточняется.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
