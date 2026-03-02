import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language } from '../translations';

const supabaseUrl = 'https://ivrnnzubplghzizefmjw.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cm5uenVicGxnaHppemVmbWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzgwMjYsImV4cCI6MjA4NDkxNDAyNn0.XSzX8a7d8qJTrvuiiD1KEhGG2v1lKKybkv3R24_yZz4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Files are stored in Supabase Storage now; the dashboard shows counts + latest names.
const UPLOAD_API_BASE = '';

interface ClientDashboardPageProps {
  lang: Language;
}

const ClientDashboardPage: React.FC<ClientDashboardPageProps> = ({ lang }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    personalEmail: '',
    addressLine1: '',
    workEmail: '',
    addressLine2: '',
    mobile: '',
    city: '',
    postcode: '',
    telephone: '',
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);

          const savedProfile = localStorage.getItem(`client_profile_full_v5_${session.user.id}`);
          if (savedProfile) setFormData(JSON.parse(savedProfile));
          else setFormData((prev) => ({ ...prev, personalEmail: session.user.email || '' }));

          // Load documents from DB so they show across browsers
          const email = session.user.email;
          if (email) {
            const { data: clientRow, error: cErr } = await supabase
              .from('clients')
              .select('id')
              .eq('email', email)
              .maybeSingle();
            if (cErr) throw cErr;

            if (clientRow?.id) {
              const { data: docs, error: dErr } = await supabase
                .from('documents')
                .select(
                  'id, name, category, doc_kind, file_path, uploaded_at, mime_type, file_size'
                )
                .eq('client_id', clientRow.id)
                .order('uploaded_at', { ascending: false });
              if (dErr) throw dErr;

              const mapped = (docs || []).map((d: any) => {
                let uiCategory = 'OTHER';
                let subCategory: any = undefined;
                if (d.category === 'identity') {
                  uiCategory = 'IDENTITY';
                  if (d.doc_kind === 'passport') subCategory = 'PASSPORT';
                  if (d.doc_kind === 'driver_license') subCategory = 'LICENSE';
                } else if (d.doc_kind === 'bank_statement') uiCategory = 'BANK';
                else if (d.doc_kind === 'compliance') uiCategory = 'COMPLIANCE';
                else if (d.doc_kind === 'expenses') uiCategory = 'EXPENSES';
                else uiCategory = 'OTHER';

                // file_path now contains Supabase Storage object path
                const storagePath = String(d.file_path || '').replace(/^\/+/, '');

                return {
                  id: d.id,
                  name: d.name,
                  category: uiCategory,
                  subCategory,
                  uploadDate: d.uploaded_at ? new Date(d.uploaded_at).toLocaleString() : '',
                  storagePath,
                  url: null,
                  thumbnail: '📄',
                };
              });

              setDocuments(mapped);
            } else {
              setDocuments([]);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveChanges = () => {
    if (!user) return;
    setSaving(true);
    localStorage.setItem(`client_profile_full_v5_${user.id}`, JSON.stringify(formData));
    setTimeout(() => {
      setSaving(false);
      alert('Profile saved.');
    }, 400);
  };

  const getIdentityDoc = (tag: string) =>
    documents.find((d) => d.category === 'IDENTITY' && d.subCategory === tag);
  const getDocCount = (cat: string) => documents.filter((d) => d.category === cat).length;

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
    letterSpacing: '0.05em',
  };
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    height: '48px',
    boxSizing: 'border-box' as const,
    outline: 'none',
    fontWeight: 'bold',
  };
  const sidebarBoxStyle = {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  };

  if (!loading && !user) {
    window.location.href = '/#client-portal';
    return null;
  }

  if (loading) return null;

  return (
    <div
      style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '110px 24px 32px 24px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingLeft: '10px',
          }}
        >
          <div style={{ flex: '1' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#0f172a',
                margin: '0',
                display: 'flex',
                alignItems: 'baseline',
                whiteSpace: 'nowrap',
              }}
            >
              <span>Client Portal</span>
              <span style={{ color: '#c5a059', marginLeft: '16px' }}>Master Secure Workspace</span>
            </h1>
            <p
              style={{
                color: '#64748b',
                margin: '8px 0 0 15px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              manage your profile , upload all your documents
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 140px 110px',
              gap: '8px',
              paddingTop: '4px',
            }}
          >
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '10px 0',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                height: '44px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              }}
            >
              {saving ? '...' : 'Save changes'}
            </button>
            <button
              onClick={() => navigate('/client/documents')}
              style={{
                backgroundColor: '#c5a059',
                color: '#ffffff',
                padding: '10px 0',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                height: '44px',
              }}
            >
              Documents
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/#client-portal';
              }}
              style={{
                backgroundColor: 'white',
                color: '#64748b',
                padding: '10px 0',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                height: '44px',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr',
            gap: '24px',
            marginTop: '48px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '32px',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              }}
            >
              <h2
                style={{
                  fontSize: '31px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  marginBottom: '32px',
                  margin: '0 0 32px 0',
                }}
              >
                Profile details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>NAME</label>
                  <input
                    type="text"
                    value={formData.name}
                    style={inputStyle}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>PERSONAL EMAIL</label>
                  <input
                    type="email"
                    value={formData.personalEmail}
                    style={inputStyle}
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>ADDRESS LINE 1</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    style={inputStyle}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>WORK EMAIL</label>
                  <input
                    type="email"
                    value={formData.workEmail}
                    placeholder="work@company.com"
                    style={inputStyle}
                    onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>ADDRESS LINE 2</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    style={inputStyle}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>MOBILE</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    style={inputStyle}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={labelStyle}>CITY</label>
                    <input
                      type="text"
                      value={formData.city}
                      style={inputStyle}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>POSTCODE</label>
                    <input
                      type="text"
                      value={formData.postcode}
                      style={inputStyle}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>TELEPHONE</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    style={inputStyle}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { label: 'AI Legal', sub: 'Advice', icon: '⚖️', path: '/ai/legal' },
                { label: 'AI Translate', sub: 'Docs', icon: '🌐', path: '/ai/translation' },
                { label: 'AI Analysis', sub: 'Reports', icon: '📊', path: '/ai/analysis' },
                { label: 'AI Chat', sub: 'Support', icon: '💬', path: '/ai/chat' },
              ].map((tool, i) => (
                <div
                  key={i}
                  onClick={() => navigate(tool.path)}
                  style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px', filter: 'saturate(1.5)' }}>
                    {tool.icon}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>
                    {tool.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>
                    {tool.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={sidebarBoxStyle}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '900',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}
              >
                Accounting Documents
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'BANK', cat: 'BANK', color: '#86efac', icon: '🏦' },
                  { label: 'COMPLIANCE', cat: 'COMPLIANCE', color: '#fca5a5', icon: '⚖️' },
                  { label: 'EXPENSES', cat: 'EXPENSES', color: '#fef08a', icon: '💰' },
                  { label: 'OTHER', cat: 'OTHER', color: '#93c5fd', icon: '📂' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: item.color,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                        }}
                      >
                        {item.icon}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                        {item.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                      {getDocCount(item.cat)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={sidebarBoxStyle}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '900',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                Latest Uploads
              </div>
              <div style={{ height: '100px', overflowY: 'auto' }}>
                {documents
                  .slice()
                  .reverse()
                  .map((d, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 0',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: '900',
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '140px',
                        }}
                      >
                        {d.name}
                      </div>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                        {d.uploadDate.split(',')[0]}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
