import './styles/site-layout.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import CarsPage from './pages/CarsPage';
import MotorcyclesPage from './pages/MotorcyclesPage';
import CarDetailPage from './pages/CarDetailPage';
import MotorcycleDetailPage from './pages/MotorcycleDetailPage';
import ProfilePage from './pages/ProfilePage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ContactsPage from './pages/ContactsPage';
import NewsPage from './pages/NewsPage';
import ServicesPage from './pages/ServicesPage';
import ApplicationRequestPage from './pages/ApplicationRequestPage';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/:slug" element={<CarDetailPage />} />
        <Route path="/motorcycles" element={<MotorcyclesPage />} />
        <Route path="/motorcycles/:slug" element={<MotorcycleDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/request-car/:vehicleId" element={<ApplicationRequestPage vehicleKind="car" />} />
        <Route path="/request-moto/:vehicleId" element={<ApplicationRequestPage vehicleKind="moto" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
