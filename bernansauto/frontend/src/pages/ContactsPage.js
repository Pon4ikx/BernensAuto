import React, { useEffect, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import Breadcrumbs from '../components/Breadcrumbs';
import { api } from '../api';
import '../styles/ContactsPage.css';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setErrorText('');
        const res = await api.get('content/contacts/');
        if (!isMounted) return;
        setContacts(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (!isMounted) return;
        setErrorText('Не удалось загрузить контакты. Проверьте, что бэкенд запущен.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const primary = contacts[0] || null;

  return (
    <div className="contacts-page">
      <SiteHeader />
      <main className="contacts-main">
        <Breadcrumbs
          lead
          items={[
            { to: '/', label: 'Главная' },
            { label: 'Контакты' },
          ]}
        />
        <div className="container">
          <div className="contacts-hero">
            <h1>Контакты</h1>
            <p>Свяжитесь с нами любым удобным способом. Мы на связи и поможем с выбором техники.</p>
          </div>

          {loading && <div className="contacts-muted">Загрузка…</div>}
          {errorText && <div className="contacts-error">{errorText}</div>}

          {!loading && !errorText && (
            <div className="contacts-grid">
              <section className="contacts-card">
                <h2>Основные контакты</h2>
                {!primary && <p className="contacts-muted">Контакты пока не заполнены в админ-панели.</p>}
                {primary && (
                  <div className="contacts-lines">
                    {primary.phone && (
                      <div className="contacts-line">
                        <div className="contacts-line-label">Телефон</div>
                        <div className="contacts-line-value">{primary.phone}</div>
                      </div>
                    )}
                    {primary.email && (
                      <div className="contacts-line">
                        <div className="contacts-line-label">Email</div>
                        <div className="contacts-line-value">{primary.email}</div>
                      </div>
                    )}
                    {primary.address && (
                      <div className="contacts-line">
                        <div className="contacts-line-label">Адрес</div>
                        <div className="contacts-line-value">{primary.address}</div>
                      </div>
                    )}
                    {primary.work_hours && (
                      <div className="contacts-line">
                        <div className="contacts-line-label">Время работы</div>
                        <div className="contacts-line-value">{primary.work_hours}</div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {contacts.length > 1 && (
                <section className="contacts-card contacts-card-wide">
                  <h2>Дополнительные контакты</h2>
                  <div className="contacts-extra">
                    {contacts.slice(1).map((c) => (
                      <div key={c.id} className="contacts-extra-item">
                        <div className="contacts-extra-title">{c.phone || c.email || 'Контакты'}</div>
                        <div className="contacts-muted">
                          {[c.address, c.work_hours].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

