import React from 'react';

const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
};

const h2: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: '#0f172a',
  margin: '0 0 8px 0',
};
const p: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: 2.0,
};

const FeaturesPage: React.FC = () => {
  return (
    <div
      style={{ minHeight: '100vh', backgroundColor: '#fdfcfb', fontFamily: 'Arial, sans-serif' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 24px 48px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
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
              PLS Portal
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', margin: '8px 0 0' }}>
              Admin Guide: Site Features
            </h1>
            <div style={{ marginTop: 8, color: '#64748b', fontWeight: 800 }}>
              A practical, non-technical overview for admin users.
            </div>
          </div>
          <button
            onClick={() => (window.location.href = '/admin/clients')}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 0,
              borderRadius: 12,
              padding: '10px 14px',
              fontWeight: 900,
              cursor: 'pointer',
              height: 40,
            }}
          >
            Back Home
          </button>
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          <div style={card}>
            <div style={h2}>What the site is</div>
            <p style={p}>
              This is the PLS website plus an Admin Console and a Client Portal. Admin uses it to
              manage clients and keep documents organised.
            </p>
          </div>

          <div style={card}>
            <div style={h2}>Client Portal (what clients do)</div>
            <p style={p}>
              Clients can log in, view their workspace, and upload the documents you request
              (identity and accounting).
            </p>
          </div>

          <div style={card}>
            <div style={h2}>Documents (upload + view)</div>
            <p style={p}>
              Uploaded files appear in the Documents area so you can quickly see what has been
              received. Identity documents (Passport/Licence) show previews.
            </p>
          </div>

          <div style={card}>
            <div style={h2}>Documents (delete)</div>
            <p style={p}>
              If a document is deleted, it should stay deleted after refresh (so the list remains
              clean).
            </p>
          </div>

          <div style={card}>
            <div style={h2}>Admin Console</div>
            <p style={p}>
              Admin pages provide a list of clients and a global view of documents. It’s designed
              for day-to-day operations.
            </p>
          </div>

          <div style={card}>
            <div style={h2}>Admin Clients (checkbox multi‑select)</div>
            <p style={p}>
              The Clients page includes checkboxes so you can select multiple clients for the next
              admin task/workflow.
            </p>
          </div>

          <div style={card}>
            <div style={h2}>Selection is shared & persistent</div>
            <p style={p}>
              The selected clients are saved and shared — so if you open admin on another
              browser/device, the same clients will still be selected.
            </p>
          </div>

          <div style={card}>
            <div style={h2}>AI pages (optional)</div>
            <p style={p}>
              The site includes AI tools (Legal / Translation / Analysis / Chat). These may be
              enabled/disabled depending on configuration.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 18, ...card }}>
          <div style={h2}>What’s stored where</div>
          <p style={p}>
            Client details and the document list are stored in the system database. The actual
            uploaded files are stored on the server.
          </p>
        </div>

        <div style={{ marginTop: 14, ...card }}>
          <div style={h2}>What we can build next</div>
          <p style={p}>
            Common next steps: admin upload-on-behalf (using selected clients), invoices workflow,
            document request/chaser workflow, and basic admin protection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
