import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../src/styles/AdminShell.css';

export const AdminShell: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const loc = useLocation();
  const path = loc.pathname;

  const tabClass = (active: boolean) =>
    `admin-shell__tab${active ? ' admin-shell__tab--active' : ''}`;

  return (
    <div className="admin-shell">
      <div className="admin-shell__container">
        <div className="admin-shell__header">
          <div>
            <div className="admin-shell__label">Admin Console</div>
            <h1 className="admin-shell__title">{title}</h1>
            {subtitle && <div className="admin-shell__subtitle">{subtitle}</div>}
          </div>
          <div className="admin-shell__actions">
            <button
              type="button"
              onClick={() => (window.location.href = '/admin/features')}
              className="admin-shell__btn-features"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              className="admin-shell__btn-exit"
            >
              Exit Admin
            </button>
          </div>
        </div>

        <div className="admin-shell__tabs">
          <Link to="/admin/clients" className={tabClass(path.startsWith('/admin/clients'))}>
            Clients
          </Link>
          <Link
            to="/admin/client-select"
            className={tabClass(path.startsWith('/admin/client-select'))}
          >
            Client Select
          </Link>
          <Link to="/admin/documents" className={tabClass(path.startsWith('/admin/documents'))}>
            Documents
          </Link>
          <Link to="/admin/invoices" className={tabClass(path.startsWith('/admin/invoices'))}>
            Invoices
          </Link>
          <Link to="/admin/services" className={tabClass(path.startsWith('/admin/services'))}>
            Services
          </Link>
          <Link to="/admin/users" className={tabClass(path.startsWith('/admin/users'))}>
            Users
          </Link>
        </div>

        <div className="admin-shell__content">{children}</div>
      </div>
    </div>
  );
};
