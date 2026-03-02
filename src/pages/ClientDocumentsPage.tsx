import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
            <div style={{ width: '140px' }}></div>
            <button
              onClick={() => navigate('/client')}
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
              Back to portal
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
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '40px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                marginBottom: '32px',
                color: '#0f172a',
              }}
            >
              Identity Documents
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    border: '1px solid #f1f5f9',
                    borderRadius: '16px',
                    height: '180px',
                    overflow: 'hidden',
                    backgroundColor: '#fcfcfc',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getIdentityDoc('PASSPORT') ? (
                    <img
                      src={getIdentityDoc('PASSPORT').thumbnail}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '40px', opacity: 0.1 }}>Passport</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    color: '#0f172a',
                  }}
                >
                  Passport.png
                </div>
                <button
                  onClick={() => passportInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  UPLOAD PASSPORT
                </button>
                <input
                  type="file"
                  ref={passportInputRef}
                  style={{ display: 'none' }}
                  accept="image/png,image/jpeg,image/*,.pdf"
                  onChange={handleFileUpload('IDENTITY', 'PASSPORT')}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    border: '1px solid #f1f5f9',
                    borderRadius: '16px',
                    height: '180px',
                    overflow: 'hidden',
                    backgroundColor: '#fcfcfc',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getIdentityDoc('LICENSE') ? (
                    <img
                      src={getIdentityDoc('LICENSE').thumbnail}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '40px', opacity: 0.1 }}>License</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    color: '#0f172a',
                  }}
                >
                  Drivers Licence.png
                </div>
                <button
                  onClick={() => licenseInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  UPLOAD LICENCE
                </button>
                <input
                  type="file"
                  ref={licenseInputRef}
                  style={{ display: 'none' }}
                  accept="image/png,image/jpeg,image/*,.pdf"
                  onChange={handleFileUpload('IDENTITY', 'LICENSE')}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categories.map((item) => (
              <div
                key={item.label}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: item.color,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}
                  >
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                    {item.label}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setUploadTargetCat(item.cat);
                    categoryInputRef.current?.click();
                  }}
                  style={{
                    backgroundColor: '#0f172a',
                    color: 'white',
                    padding: '10px 30px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  UPLOAD
                </button>
              </div>
            ))}
            <input
              type="file"
              ref={categoryInputRef}
              style={{ display: 'none' }}
              accept="image/png,image/jpeg,image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(e) => uploadTargetCat && handleFileUpload(uploadTargetCat)(e)}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginTop: '48px',
            marginBottom: '22px',
          }}
        >
          {categories.map((item) => (
            <div
              key={item.label}
              onClick={() => setActiveCategory(activeCategory === item.cat ? null : item.cat)}
              style={{
                cursor: 'pointer',
                backgroundColor: 'white',
                border: activeCategory === item.cat ? '3.5px solid #0f172a' : '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  letterSpacing: '0.1em',
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>
                {getCount(item.cat)}
              </div>
              <div
                style={{
                  background: item.color,
                  height: '5px',
                  borderRadius: '3px',
                  marginTop: '16px',
                  width: '45px',
                  margin: '16px auto 0',
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* Uploaded documents */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '12px',
              marginBottom: '14px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
              Uploaded Documents
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
              {activeCategory ? `Showing: ${activeCategory}` : 'Showing: ALL'}
            </div>
          </div>

          {(['IDENTITY', 'BANK', 'COMPLIANCE', 'EXPENSES', 'OTHER'] as const)
            .filter((cat) => !activeCategory || activeCategory === cat)
            .map((cat) => {
              const docs = getDocsFor(cat);
              const color =
                cat === 'IDENTITY'
                  ? '#cbd5e1'
                  : categories.find((c) => c.cat === cat)?.color || '#e2e8f0';
              return (
                <div key={cat} style={{ marginTop: '18px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '99px',
                          background: color,
                        }}
                      ></div>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
                        {cat}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
                        ({docs.length})
                      </div>
                    </div>
                  </div>

                  {docs.length === 0 ? (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        fontWeight: 700,
                        padding: '14px 0',
                      }}
                    >
                      No documents uploaded yet.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '14px',
                      }}
                    >
                      {docs.map((d: any) => (
                        <div
                          key={d.id}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            background: '#ffffff',
                          }}
                        >
                          <div
                            style={{
                              height: '120px',
                              background: '#f8fafc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            {d.isImage ? (
                              <img
                                src={d.url}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : d.isPdf ? (
                              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    opacity: 0.35,
                                    color: '#0f172a',
                                  }}
                                >
                                  PDF
                                </div>
                                <img
                                  src={d.thumbUrl}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.currentTarget as any).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div style={{ fontSize: '34px', opacity: 0.35 }}>📄</div>
                            )}
                          </div>
                          <div style={{ padding: '12px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <div
                                title={d.name}
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 900,
                                  color: '#0f172a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {d.name}
                              </div>
                              <div
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 900,
                                  color: '#64748b',
                                  border: '1px solid #e2e8f0',
                                  padding: '2px 6px',
                                  borderRadius: '999px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
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
                            <div
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#94a3b8',
                                marginTop: '4px',
                              }}
                            >
                              {d.uploadDate || ''}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  flex: 1,
                                  textDecoration: 'none',
                                  backgroundColor: '#0f172a',
                                  color: 'white',
                                  padding: '8px 10px',
                                  borderRadius: '10px',
                                  textAlign: 'center',
                                  fontSize: '11px',
                                  fontWeight: 900,
                                }}
                              >
                                View
                              </a>
                              <button
                                onClick={() => handleDelete(d)}
                                style={{
                                  backgroundColor: 'white',
                                  color: '#ef4444',
                                  border: '1px solid #fecaca',
                                  padding: '8px 10px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: 900,
                                  cursor: 'pointer',
                                }}
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
