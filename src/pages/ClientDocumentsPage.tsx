import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ClientDocumentsPage.css';

const supabaseUrl = 'https://ivrnnzubplghzizefmjw.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cm5uenVicGxnaHppemVmbWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzgwMjYsImV4cCI6MjA4NDkxNDAyNn0.XSzX8a7d8qJTrvuiiD1KEhGG2v1lKKybkv3R24_yZz4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const UPLOAD_API_BASE =
  (import.meta as any).env?.VITE_UPLOAD_API_BASE || 'http://77.42.79.205:3001';

const ClientDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  const passportInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetCat, setUploadTargetCat] = useState<any>(null);

  const [clientId, setClientId] = useState<string | null>(null);

  const getHiddenKey = (userId: string) => `pls_hidden_docs_v1_${userId}`;

  const getHiddenIds = (userId?: string | null) => {
    try {
      const uid = userId || user?.id;
      if (!uid) return [] as string[];
      const raw = localStorage.getItem(getHiddenKey(uid));
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [] as string[];
    }
  };

  const addHiddenId = (docId: string, userId?: string | null) => {
    try {
      const uid = userId || user?.id;
      if (!uid) return;
      const cur = new Set(getHiddenIds(uid));
      cur.add(docId);
      localStorage.setItem(getHiddenKey(uid), JSON.stringify(Array.from(cur)));
    } catch {
      // ignore
    }
  };

  const loadDocumentsFromDb = async (email: string, userId?: string | null) => {
    const { data: clientRow, error: cErr } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (cErr) throw cErr;

    if (!clientRow?.id) {
      setClientId(null);
      setDocuments([]);
      return;
    }

    setClientId(clientRow.id);

    const { data: docs, error: dErr } = await supabase
      .from('documents')
      .select('id, name, category, doc_kind, file_path, uploaded_at, mime_type, file_size')
      .eq('client_id', clientRow.id)
      .order('uploaded_at', { ascending: false });
    if (dErr) throw dErr;

    const hidden = new Set(getHiddenIds(userId));

    const mapped = (docs || [])
      .filter((d: any) => !hidden.has(d.id))
      .map((d: any) => {
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

        const rawPath = String(d.file_path || '');
        let rel = rawPath.replace(/^\/+/, '');
        if (rel.startsWith('uploads/')) rel = rel.slice('uploads/'.length);
        const url = `${UPLOAD_API_BASE}/uploads/${rel}`;

        const fileNameLower = String(d.name || '').toLowerCase();
        const ext = fileNameLower.includes('.') ? fileNameLower.split('.').pop() : '';
        const mime = String(d.mime_type || '').toLowerCase();

        const isPdf = mime.includes('pdf') || ext === 'pdf';
        const isImage =
          mime.startsWith('image/') ||
          ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(String(ext || ''));

        const thumbUrl = isPdf ? `${url}.thumb.png` : isImage ? url : null;

        return {
          id: d.id,
          name: d.name,
          category: uiCategory,
          subCategory,
          uploadDate: d.uploaded_at ? new Date(d.uploaded_at).toLocaleString() : '',
          url,
          thumbUrl,
          mime_type: d.mime_type,
          file_size: d.file_size,
          isImage,
          isPdf,
          thumbnail: isImage ? url : '📄',
        };
      });

    setDocuments(mapped);
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          const email = session.user.email;
          if (email) await loadDocumentsFromDb(email);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const email = session?.user?.email;
    if (email) await loadDocumentsFromDb(email);
  };

  const docKindFor = (uiCat: string, sub?: 'PASSPORT' | 'LICENSE') => {
    if (uiCat === 'IDENTITY') {
      if (sub === 'PASSPORT') return 'passport';
      if (sub === 'LICENSE') return 'driver_license';
      return 'identity';
    }
    if (uiCat === 'BANK') return 'bank_statement';
    if (uiCat === 'COMPLIANCE') return 'compliance';
    if (uiCat === 'EXPENSES') return 'expenses';
    return 'other';
  };

  const dbCategoryFor = (uiCat: string) => (uiCat === 'IDENTITY' ? 'identity' : 'accounting');

  const handleFileUpload =
    (category: string, sub?: 'PASSPORT' | 'LICENSE') =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      if (!clientId && user?.email) {
        // best-effort refresh clientId before upload
        try {
          await loadDocumentsFromDb(user.email);
        } catch (err) {
          console.error(err);
        }
      }
      if (!clientId) {
        alert('No client record found for this login.');
        e.target.value = '';
        return;
      }

      // Upload to local disk API
      const form = new FormData();
      form.append('file', file);
      form.append('category', category);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('Not logged in');

        const resp = await fetch(`${UPLOAD_API_BASE}/api/upload-to-disk`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!resp.ok) throw new Error(`Upload failed (${resp.status})`);
        const data = await resp.json();

        const filePath = data.relativePath || String(data.url || '').replace(/^\/uploads\//, '');
        const uiCat = category;
        const doc_kind = docKindFor(uiCat, sub);
        const db_category = dbCategoryFor(uiCat);

        // Insert metadata so it shows across browsers/devices
        const { error: iErr } = await supabase.from('documents').insert({
          client_id: clientId,
          name: file.name,
          category: db_category,
          doc_kind,
          file_path: filePath,
          mime_type: file.type || null,
          file_size: file.size || null,
        });
        if (iErr) throw iErr;

        // For identity docs, keep it single in the UI by reloading from DB (latest wins)
        await refresh();
      } catch (err) {
        console.error(err);
        alert('Upload failed.');
      } finally {
        // allow re-uploading same file
        e.target.value = '';
      }
    };

  const getIdentityDoc = (tag: string) =>
    documents.find((d) => d.category === 'IDENTITY' && d.subCategory === tag);
  const getCount = (cat: string) => documents.filter((d) => d.category === cat).length;
  const getDocsFor = (cat: string) => documents.filter((d) => d.category === cat);

  const handleDelete = async (doc: any) => {
    const ok = confirm('Delete this document?');
    if (!ok) return;

    // Hide immediately (so it "stays deleted" in the UI even if DB/RLS blocks the delete)
    addHiddenId(doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not logged in');

      // Best-effort delete the underlying disk file (server upload)
      const rel = String(doc.url || '').split('/uploads/')[1] || '';
      if (rel) {
        await fetch(`${UPLOAD_API_BASE}/api/delete-upload`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ relativePath: rel }),
        }).catch(() => null);
      }

      // Use a SECURITY DEFINER RPC to ensure the DB row is actually deleted (RLS can otherwise make delete a no-op).
      const { error } = await supabase.rpc('delete_document', { p_id: doc.id });
      if (error) throw error;

      await refresh();
    } catch (e: any) {
      console.error(e);
      alert(`Delete failed (document may reappear on refresh).\n\n${e?.message || e}`);
    }
  };

  const categories = [
    { label: 'BANK', color: '#86efac', cat: 'BANK', icon: '🏦' },
    { label: 'COMPLIANCE', color: '#fca5a5', cat: 'COMPLIANCE', icon: '⚖️' },
    { label: 'EXPENSES', color: '#fef08a', cat: 'EXPENSES', icon: '💰' },
    { label: 'OTHER', color: '#93c5fd', cat: 'OTHER', icon: '📂' },
  ];

  if (loading) return null;

  return (
    <div className="cdp-page">
      <div className="cdp-container">
        <div className="cdp-header">
          <div className="cdp-header-left">
            <h1 className="cdp-title">
              <span>Client Portal</span>
              <span className="cdp-title-sub">Master Secure Workspace</span>
            </h1>
            <p className="cdp-subtitle">manage your profile , upload all your documents</p>
          </div>
          <div className="cdp-header-right">
            <div className="cdp-header-spacer"></div>
            <button type="button" onClick={() => navigate('/client')} className="cdp-btn-back">
              Back to portal
            </button>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/#client-portal';
              }}
              className="cdp-btn-logout"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="cdp-main-grid">
          <div className="cdp-identity-card">
            <h2 className="cdp-identity-title">Identity Documents</h2>
            <div className="cdp-identity-cols">
              <div className="cdp-identity-col">
                <div className="cdp-doc-preview">
                  {getIdentityDoc('PASSPORT') ? (
                    <img src={getIdentityDoc('PASSPORT').thumbnail} alt="Passport document" />
                  ) : (
                    <span className="cdp-doc-preview-placeholder">Passport</span>
                  )}
                </div>
                <div className="cdp-doc-label">Passport.png</div>
                <button
                  type="button"
                  onClick={() => passportInputRef.current?.click()}
                  className="cdp-upload-btn"
                >
                  UPLOAD PASSPORT
                </button>
                <input
                  type="file"
                  ref={passportInputRef}
                  className="cdp-hidden-input"
                  aria-label="Upload passport document"
                  accept="image/png,image/jpeg,image/*,.pdf"
                  onChange={handleFileUpload('IDENTITY', 'PASSPORT')}
                />
              </div>
              <div className="cdp-identity-col">
                <div className="cdp-doc-preview">
                  {getIdentityDoc('LICENSE') ? (
                    <img
                      src={getIdentityDoc('LICENSE').thumbnail}
                      alt="Driver's licence document"
                    />
                  ) : (
                    <span className="cdp-doc-preview-placeholder">License</span>
                  )}
                </div>
                <div className="cdp-doc-label">Drivers Licence.png</div>
                <button
                  type="button"
                  onClick={() => licenseInputRef.current?.click()}
                  className="cdp-upload-btn"
                >
                  UPLOAD LICENCE
                </button>
                <input
                  type="file"
                  ref={licenseInputRef}
                  className="cdp-hidden-input"
                  aria-label="Upload driver's licence document"
                  accept="image/png,image/jpeg,image/*,.pdf"
                  onChange={handleFileUpload('IDENTITY', 'LICENSE')}
                />
              </div>
            </div>
          </div>

          <div className="cdp-categories-col">
            {categories.map((item) => (
              <div key={item.label} className="cdp-category-card">
                <div className="cdp-category-left">
                  <div className={`cdp-category-icon cdp-color-${item.label.toLowerCase()}`}>
                    {item.icon}
                  </div>
                  <span className="cdp-category-label">{item.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadTargetCat(item.cat);
                    categoryInputRef.current?.click();
                  }}
                  className="cdp-upload-btn-sm"
                >
                  UPLOAD
                </button>
              </div>
            ))}
            <input
              type="file"
              ref={categoryInputRef}
              className="cdp-hidden-input"
              aria-label="Upload category document"
              accept="image/png,image/jpeg,image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                uploadTargetCat && handleFileUpload(uploadTargetCat)(e)
              }
            />
          </div>
        </div>

        <div className="cdp-stats-grid">
          {categories.map((item) => (
            <div
              key={item.label}
              className={`cdp-stat-card${activeCategory === item.cat ? ' cdp-stat-card--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === item.cat ? null : item.cat)}
            >
              <div className="cdp-stat-label">{item.label}</div>
              <div className="cdp-stat-count">{getCount(item.cat)}</div>
              <div className={`cdp-stat-bar cdp-color-${item.label.toLowerCase()}`}></div>
            </div>
          ))}
        </div>

        {/* Uploaded documents */}
        <div className="cdp-docs-panel">
          <div className="cdp-docs-header">
            <div className="cdp-docs-title">Uploaded Documents</div>
            <div className="cdp-docs-filter">
              {activeCategory ? `Showing: ${activeCategory}` : 'Showing: ALL'}
            </div>
          </div>

          {(['IDENTITY', 'BANK', 'COMPLIANCE', 'EXPENSES', 'OTHER'] as const)
            .filter((cat) => !activeCategory || activeCategory === cat)
            .map((cat) => {
              const docs = getDocsFor(cat);
              return (
                <div key={cat} className="cdp-cat-section">
                  <div className="cdp-cat-header">
                    <div className="cdp-cat-left">
                      <div className={`cdp-cat-dot cdp-color-${cat.toLowerCase()}`}></div>
                      <div className="cdp-cat-name">{cat}</div>
                      <div className="cdp-cat-count">({docs.length})</div>
                    </div>
                  </div>

                  {docs.length === 0 ? (
                    <div className="cdp-no-docs">No documents uploaded yet.</div>
                  ) : (
                    <div className="cdp-doc-grid">
                      {docs.map((d: any) => (
                        <div key={d.id} className="cdp-doc-card">
                          <div className="cdp-doc-thumb">
                            {d.isImage ? (
                              <img src={d.url} alt={d.name} />
                            ) : d.isPdf ? (
                              <div className="cdp-pdf-thumb">
                                <div className="cdp-pdf-overlay">PDF</div>
                                <img
                                  src={d.thumbUrl}
                                  alt={d.name}
                                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="cdp-file-icon">📄</div>
                            )}
                          </div>
                          <div className="cdp-doc-info">
                            <div className="cdp-doc-name-row">
                              <div className="cdp-doc-name" title={d.name}>
                                {d.name}
                              </div>
                              <div className="cdp-doc-type-badge">
                                {d.isImage
                                  ? 'IMAGE'
                                  : d.isPdf
                                    ? 'PDF'
                                    : String(d.name || '').includes('.')
                                      ? String(d.name || '')
                                          .split('.')
                                          .pop()
                                          ?.toUpperCase()
                                      : 'FILE'}
                              </div>
                            </div>
                            <div className="cdp-doc-date">{d.uploadDate || ''}</div>
                            <div className="cdp-doc-actions">
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="cdp-btn-view"
                              >
                                View
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDelete(d)}
                                className="cdp-btn-delete"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ClientDocumentsPage;
