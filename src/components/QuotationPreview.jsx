import React from "react";
import { resolveDownloadUrl } from "../services/quotationApi";
import "./QuotationPreview.css";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function QuotationPreview({ values, result, error }) {
  const { organizationName, validationDate, selectedModules, quotationTo } = values;

  return (
    <aside className="q-preview">
      <div className="q-ticket">
        <div className="q-ticket__top">
          <span className="q-ticket__brand">BlechTek</span>
          <span className="q-ticket__type">Quotation</span>
        </div>

        <div className="q-ticket__body">
          <p className="q-ticket__label">Prepared for</p>
          <p className="q-ticket__value">{organizationName || "Organization name"}</p>

          <p className="q-ticket__label">Attention</p>
          <p className="q-ticket__value">{quotationTo.name || "Contact name"}</p>

          <p className="q-ticket__label">Scope</p>
          <div className="q-ticket__modules">
            {selectedModules.length === 0 && <span className="q-ticket__placeholder">No modules selected yet</span>}
            {selectedModules.map((m) => (
              <span className="q-ticket__module" key={m}>{m}</span>
            ))}
          </div>
        </div>

        <div className="q-ticket__perforation" aria-hidden="true" />

        <div className="q-ticket__stub">
          <div>
            <p className="q-ticket__label">Valid until</p>
            <p className="q-ticket__mono">{formatDate(validationDate)}</p>
          </div>
          <div>
            <p className="q-ticket__label">Modules</p>
            <p className="q-ticket__mono">{String(selectedModules.length).padStart(2, "0")}</p>
          </div>
        </div>
      </div>

      {error && <div className="q-preview__error">{error}</div>}

      {result && (
        <div className="q-result">
          <p className="q-result__title">Quotation generated</p>
          <p className="q-result__id">{result.quotationId}</p>
          <div className="q-result__actions">
            <a
              className="q-result__btn q-result__btn--primary"
              href={resolveDownloadUrl(result.pdfDownloadUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Download PDF
            </a>
            {/* <a
              className="q-result__btn"
              href={resolveDownloadUrl(result.wordDownloadUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Download Word
            </a> */}
          </div>
        </div>
      )}
    </aside>
  );
}
