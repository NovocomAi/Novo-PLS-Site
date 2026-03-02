import React from 'react';
import '../src/styles/FeaturesPage.css';

const FeaturesPage: React.FC = () => {
  return (
    <div className="fp-page">
      <div className="fp-container">
        <div className="fp-header">
          <div>
            <div className="fp-label">PLS Portal</div>
            <h1 className="fp-title">Admin Guide: Site Features</h1>
            <div className="fp-subtitle">A practical, non-technical overview for admin users.</div>
          </div>
          <button onClick={() => (window.location.href = '/admin/clients')} className="fp-btn-back">
            Back Home
          </button>
        </div>

        <div className="fp-grid">
          <div className="fp-card">
            <div className="fp-card-title">What the site is</div>
            <p className="fp-card-text">
              This is the PLS website plus an Admin Console and a Client Portal. Admin uses it to
              manage clients and keep documents organised.
            </p>
          </div>

          <div className="fp-card">
            <div className="fp-card-title">Client Portal (what clients do)</div>
            <p className="fp-card-text">
              Clients can log in, view their workspace, and upload the documents you request
              (identity and accounting).
            </p>
          </div>

          <div className="fp-card">
            <div className="fp-card-title">Documents (upload + view)</div>
            <p className="fp-card-text">
              Uploaded files appear in the Documents area so you can quickly see what has been
              received. Identity documents (Passport/Licence) show previews.
            </p>
          </div>

          <div className="fp-card">
            <div className="fp-card-title">Documents (delete)</div>
            <p className="fp-card-text">
              If a document is deleted, it should stay deleted after refresh (so the list remains
              clean).
            </p>
          </div>

          <div className="fp-card">
            <div className="fp-card-title">Admin Console</div>
            <p className="fp-card-text">
              Admin pages provide a list of clients and a global view of documents. It’s designed
              for day-to-day operations.
            </p>
          </div>

          <div className="fp-card">
            <div className="fp-card-title">Admin Clients (checkbox multi‑select)</div>
            <p className="fp-card-text">
              The Clients page includes checkboxes so you can select multiple clients for the next
              admin task/workflow.
            </p>
          </div>

          <div className="fp-card">
            <div className="fp-card-title">Selection is shared & persistent</div>
            <p className="fp-card-text">
              The selected clients are saved and shared — so if you open admin on another
              browser/device, the same clients will still be selected.
            </p>
          </div>

          <div className="fp-card">
            <div className="fp-card-title">AI pages (optional)</div>
            <p className="fp-card-text">
              The site includes AI tools (Legal / Translation / Analysis / Chat). These may be
              enabled/disabled depending on configuration.
            </p>
          </div>
        </div>

        <div className="fp-card fp-card--mt18">
          <div className="fp-card-title">What’s stored where</div>
          <p className="fp-card-text">
            Client details and the document list are stored in the system database. The actual
            uploaded files are stored on the server.
          </p>
        </div>

        <div className="fp-card fp-card--mt14">
          <div className="fp-card-title">What we can build next</div>
          <p className="fp-card-text">
            Common next steps: admin upload-on-behalf (using selected clients), invoices workflow,
            document request/chaser workflow, and basic admin protection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
