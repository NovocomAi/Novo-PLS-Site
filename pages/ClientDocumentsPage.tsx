import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../src/styles/FileUpload.css';

const supabaseUrl = 'https://ivrnnzubplghzizefmjw.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cm5uenVicGxnaHppemVmbWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzgwMjYsImV4cCI6MjA4NDkxNDAyNn0.XSzX8a7d8qJTrvuiiD1KEhGG2v1lKKybkv3R24_yZz4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use same-origin so uploads work even when non-standard ports are blocked
const UPLOAD_API_BASE =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://77.42.79.205';

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

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser(session.user);

          // Map auth user -> clients row via email
          const email = session.user.email;
          if (email) {
            const { data: clientRow, error: cErr } = await supabase
              .from('clients')
              .select('id')
              .eq('email', email)
              .maybeSingle();
            if (cErr) throw cErr;
            if (clientRow?.id) {
              setClientId(clientRow.id);

              // Load documents from DB (cross-browser)
              const { data: docs, error: dErr } = await supabase
                .from('documents')
                .select(
                  'id, name, category, doc_kind, file_path, uploaded_at, mime_type, file_size'
                )
                .eq('client_id', clientRow.id)
                .order('uploaded_at', { ascending: false });
              if (dErr) throw dErr;

              const mapped = (docs || []).map((d: any) => {
                // Map DB category/doc_kind -> UI categories
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

                const storagePath = String(d.file_path || '').replace(/^\/+/, '');
                const mime = String(d.mime_type || '').toLowerCase();
                const ext =
                  String(d.name || '')
                    .toLowerCase()
                    .split('.')
                    .pop() || '';
                const isImage =
                  mime.startsWith('image/') ||
                  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
                const isPdf = mime.includes('pdf') || ext === 'pdf';

                return {
                  id: d.id,
                  name: d.name,
                  category: uiCategory,
                  subCategory,
                  uploadDate: d.uploaded_at ? new Date(d.uploaded_at).toLocaleString() : '',
                  storagePath,
                  url: null as string | null,
                  thumbnail: '📄' as any,
                  isImage,
                  isPdf,
                  _needsSigned: isImage || isPdf,
                };
              });

              // For identity images, generate signed URLs so previews work (private bucket)
              const withUrls = await Promise.all(
                mapped.map(async (m: any) => {
                  if (!m?._needsSigned || !m.storagePath) return m;
                  try {
                    const { data: s, error: sErr } = await supabase.storage
                      .from('documents')
                      .createSignedUrl(m.storagePath, 60 * 60);
                    if (sErr) throw sErr;
                    const u = s?.signedUrl || null;
                    return { ...m, url: u, thumbnail: m.isImage ? u || '📄' : '📄' };
                  } catch {
                    return m;
                  }
                })
              );

              setDocuments(withUrls);
            }
          }
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

  const saveVault = (newDocs: any[]) => {
    // Local state only now; DB is source of truth.
    setDocuments(newDocs);
  };

  const handleFileUpload =
    (category: string, sub?: 'PASSPORT' | 'LICENSE') =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!user) {
        alert('You are not logged in. Please log in again.');
        return;
      }

      try {
        if (!clientId) throw new Error('Client record not found (client mapping failed)');

        // Upload to Supabase Storage (bucket: documents)
        const categoryFolder = category || 'OTHER';
        const safeName = file.name.replace(/\s+/g, ' ').trim();
        const objectPath = `${clientId}/${categoryFolder}/${Date.now()}-${safeName}`;

        const { error: upErr } = await supabase.storage
          .from('documents')
          .upload(objectPath, file, { contentType: file.type || undefined, upsert: false });
        if (upErr) throw upErr;

        // Create signed URL for immediate preview (all image and PDF files)
        const uploadMime = (file.type || '').toLowerCase();
        const uploadExt = file.name.toLowerCase().split('.').pop() || '';
        const uploadIsImage =
          uploadMime.startsWith('image/') ||
          ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(uploadExt);
        const uploadIsPdf = uploadMime.includes('pdf') || uploadExt === 'pdf';

        let signedUrl: string | null = null;
        if (uploadIsImage || uploadIsPdf) {
          const { data: s, error: sErr } = await supabase.storage
            .from('documents')
            .createSignedUrl(objectPath, 60 * 60); // 1 hour
          if (sErr) throw sErr;
          signedUrl = s?.signedUrl || null;
        }

        // Map UI category/sub -> DB category/doc_kind
        let dbCategory: 'identity' | 'accounting' | 'other' = 'other';
        let docKind: string = 'other';

        if (category === 'IDENTITY') {
          dbCategory = 'identity';
          docKind = sub === 'PASSPORT' ? 'passport' : 'driver_license';
        } else if (category === 'BANK') {
          dbCategory = 'accounting';
          docKind = 'bank_statement';
        } else if (category === 'COMPLIANCE') {
          dbCategory = 'accounting';
          docKind = 'compliance';
        } else if (category === 'EXPENSES') {
          dbCategory = 'accounting';
          docKind = 'expenses';
        } else {
          dbCategory = 'other';
          docKind = 'other';
        }

        // Insert metadata row (cross-browser)
        const { data: inserted, error: insErr } = await supabase
          .from('documents')
          .insert({
            client_id: clientId,
            name: file.name,
            category: dbCategory,
            doc_kind: docKind,
            // Store Supabase Storage object path in file_path
            file_path: objectPath,
            file_size: file.size,
            mime_type: file.type || null,
          })
          .select('id, uploaded_at')
          .single();
        if (insErr) throw insErr;

        const mime = (file.type || '').toLowerCase();
        const ext = file.name.toLowerCase().split('.').pop() || '';
        const isImage =
          mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
        const isPdf = mime.includes('pdf') || ext === 'pdf';

        const newDoc = {
          id: inserted?.id || Math.random().toString(36).substr(2, 9),
          name: file.name,
          category,
          subCategory: sub,
          uploadDate: inserted?.uploaded_at
            ? new Date(inserted.uploaded_at).toLocaleString()
            : new Date().toLocaleString(),
          storagePath: objectPath,
          url: signedUrl,
          isImage,
          isPdf,
          thumbnail: isImage && signedUrl ? signedUrl : '📄',
        };

        const updated = [
          ...documents.filter((d) => !(sub && d.category === 'IDENTITY' && d.subCategory === sub)),
          newDoc,
        ];
        saveVault(updated);
      } catch (err: any) {
        console.error(err);
        alert(err?.message || 'Upload failed.');
      } finally {
        e.target.value = '';
      }
    };

  const getIdentityDoc = (tag: string) =>
    documents.find((d) => d.category === 'IDENTITY' && d.subCategory === tag);
  const getCount = (cat: string) => documents.filter((d) => d.category === cat).length;

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
                      alt="Passport document thumbnail"
                      className="passport-thumbnail"
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
                  className="hidden-file-input"
                  aria-label="Upload passport document"
                  title="Upload passport document"
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
                      alt="Driver's licence document preview"
                      title="Driver's licence"
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
                  className="hidden-file-input"
                  aria-label="Upload driving licence document"
                  title="Upload driving licence document"
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
              className="hidden-file-input"
              aria-label="Upload category document"
              title="Upload category document"
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
                  width: '45px',
                  margin: '16px auto 0',
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* Uploaded files strip (icons/cards) */}
        <div
          style={{
            marginTop: '24px',
            marginBottom: '48px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 900,
                  color: '#94a3b8',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                Uploaded Files
              </div>
              <div
                style={{ marginTop: '6px', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}
              >
                {activeCategory ? `${activeCategory} Files` : 'All Categories'}
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#64748b' }}>
              {activeCategory
                ? `${getCount(activeCategory)} files`
                : `${documents.filter((d) => d.category !== 'IDENTITY').length} files`}
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            {(activeCategory
              ? documents.filter((d) => d.category === activeCategory)
              : documents.filter((d) => d.category !== 'IDENTITY')
            )
              .slice()
              .sort((a, b) => String(b.uploadDate || '').localeCompare(String(a.uploadDate || '')))
              .map((doc) => {
                const catColor = categories.find((c) => c.cat === doc.category)?.color || '#e2e8f0';

                return (
                  <div
                    key={doc.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      backgroundColor: '#ffffff',
                      position: 'relative',
                    }}
                  >
                    {/* Delete */}
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${doc.name}"?`)) return;

                        const prev = documents;
                        // Optimistic UI update
                        saveVault(prev.filter((d) => d.id !== doc.id));

                        try {
                          // Delete storage object (best-effort)
                          if (doc.storagePath) {
                            await supabase.storage.from('documents').remove([doc.storagePath]);
                          }

                          const { error } = await supabase
                            .from('documents')
                            .delete()
                            .eq('id', doc.id);
                          if (error) throw error;
                        } catch (err) {
                          console.error('Delete failed:', err);
                          alert('Delete failed. Please try again.');
                          // Roll back UI
                          saveVault(prev);
                        }
                      }}
                      title="Delete file"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        cursor: 'pointer',
                        fontWeight: 900,
                        color: '#ef4444',
                        boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
                      }}
                    >
                      ✕
                    </button>

                    <div
                      style={{
                        height: '110px',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {doc.isImage && doc.thumbnail && doc.thumbnail !== '📄' ? (
                        <img
                          src={doc.thumbnail}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ fontSize: '34px' }}>{doc.thumbnail || '📄'}</div>
                      )}
                    </div>

                    {/* Category accent bar */}
                    <div style={{ height: 4, background: catColor }} />

                    <div style={{ padding: '12px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 900,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {doc.name}
                      </div>
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '10px',
                          fontWeight: 900,
                          color: '#94a3b8',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {doc.category}
                      </div>
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#64748b',
                        }}
                      >
                        {doc.uploadDate}
                      </div>
                    </div>
                  </div>
                );
              })}

            {(activeCategory
              ? documents.filter((d) => d.category === activeCategory)
              : documents.filter((d) => d.category !== 'IDENTITY')
            ).length === 0 && (
              <div
                style={{ gridColumn: '1 / -1', padding: '16px', color: '#94a3b8', fontWeight: 900 }}
              >
                No files uploaded yet{activeCategory ? ` in ${activeCategory}` : ''}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDocumentsPage;
