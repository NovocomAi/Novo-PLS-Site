/**
 * App Component - Supabase Version
 * Main application with authentication
 */

import React, { useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Layout components
import AdminDashboard from '../components/AdminDashboard';
import Footer from '../components/Footer';
import Header from '../components/Header';

// Public pages
import FeaturesPage from '../pages/FeaturesPage';
import HomePage from '../pages/HomePage';
import ResourcesPage from '../pages/ResourcesPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ClientPortalPage from './pages/ClientPortalPage';
import ClientsDirectoryPage from './pages/ClientsDirectoryPage';
import SignUpPageNew from './pages/SignUpPageNew';

// AI pages (public but enhanced when logged in)
import AiAnalysisPage from '../pages/AiAnalysisPage';
import AiChatPage from '../pages/AiChatPage';
import AiLegalPage from '../pages/AiLegalPage';
import AiTranslationPage from '../pages/AiTranslationPage';

// Protected client pages
import ClientDashboardPage from '../pages/ClientDashboardPage';
import ClientDocumentsPage from '../pages/ClientDocumentsPage';

// Protected admin pages
import AdminClientDetailPage from '../pages/AdminClientDetailPage';
import AdminClientSelectPage from '../pages/AdminClientSelectPage';
import AdminClientsPage from '../pages/AdminClientsPage';
import AdminDocumentsPage from '../pages/AdminDocumentsPage';
import AdminInvoicesPage from '../pages/AdminInvoicesPage';
import AdminServicesPage from '../pages/AdminServicesPage';
import AdminUsersPage from '../pages/AdminUsersPage';

import { Language } from '../translations';

// Scroll handler component
const ScrollToHash: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = document.getElementById(id);
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return null;
};

const AppContent: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#fdfcfb' }}>
      <Header onAdminClick={() => setIsAdminOpen(true)} lang={lang} setLang={setLang} />
      <ScrollToHash />

      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage lang={lang} />} />
          <Route path="/login" element={<ClientPortalPage />} />
          <Route path="/signup" element={<SignUpPageNew />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/directory" element={<ClientsDirectoryPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/portal" element={<ClientPortalPage />} />

          {/* AI routes (public) */}
          <Route path="/ai/legal" element={<AiLegalPage lang={lang} />} />
          <Route path="/ai/translation" element={<AiTranslationPage lang={lang} />} />
          <Route path="/ai/analysis" element={<AiAnalysisPage lang={lang} />} />
          <Route path="/ai/chat" element={<AiChatPage lang={lang} />} />

          {/* Client portal (public) */}
          <Route path="/client" element={<ClientDashboardPage lang={lang} />} />
          <Route path="/client/documents" element={<ClientDocumentsPage />} />

          {/* Admin routes (TEMP: unprotected while Supabase verification blocks access) */}
          <Route path="/admin/clients" element={<AdminClientsPage />} />
          <Route path="/admin/clients/:email" element={<AdminClientDetailPage />} />
          <Route path="/admin/documents" element={<AdminDocumentsPage />} />
          <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
          <Route path="/admin/services" element={<AdminServicesPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/client-select" element={<AdminClientSelectPage />} />
          <Route path="/admin/features" element={<FeaturesPage />} />
        </Routes>
      </main>

      <Footer />

      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
