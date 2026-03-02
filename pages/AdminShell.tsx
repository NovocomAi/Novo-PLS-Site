import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid ' + (active ? '#0f172a' : '#e2e8f0'),
  background: active ? '#0f172a' : '#fff',
  color: active ? '#fff' : '#0f172a',
  fontWeight: 900,
  fontSize: 12,
  textDecoration: 'none',
});

export const AdminShell: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const loc = useLocation();
  const path = loc.pathname;

  return (
    <div
      style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '110px 24px 32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: '#94a3b8',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Admin Console
            </div>
            <h1 style={{ fontSize: 30, margin: '8px 0 0', color: '#0f172a', fontWeight: 900 }}>
              {title}
            </h1>
            {subtitle && (
              <div style={{ marginTop: 8, color: '#64748b', fontSize: 13, fontWeight: 800 }}>
                {subtitle}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => (window.location.href = '/admin/features')}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                fontWeight: 900,
                cursor: 'pointer',
                height: 40,
              }}
            >
              Features
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                background: '#0f172a',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: 10,
                border: 0,
                fontWeight: 900,
                cursor: 'pointer',
                height: 40,
              }}
            >
              Exit Admin
            </button>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/admin/clients" style={tabStyle(path.startsWith('/admin/clients'))}>
            Clients
          </Link>
          <Link to="/admin/client-select" style={tabStyle(path.startsWith('/admin/client-select'))}>
            Client Select
          </Link>
          <Link to="/admin/documents" style={tabStyle(path.startsWith('/admin/documents'))}>
            Documents
          </Link>
          <Link to="/admin/invoices" style={tabStyle(path.startsWith('/admin/invoices'))}>
            Invoices
          </Link>
          <Link to="/admin/services" style={tabStyle(path.startsWith('/admin/services'))}>
            Services
          </Link>
          <Link to="/admin/users" style={tabStyle(path.startsWith('/admin/users'))}>
            Users
          </Link>
        </div>

        <div style={{ marginTop: 18 }}>{children}</div>
      </div>
    </div>
  );
};
