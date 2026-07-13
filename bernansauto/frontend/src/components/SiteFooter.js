import React from 'react';
import '../styles/SiteFooter.css';

export default function SiteFooter() {
  return (
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
  );
}
