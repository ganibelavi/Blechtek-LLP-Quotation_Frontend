import React, { useEffect, useState } from "react";
import { fetchModules, generateQuotation, resolveDownloadUrl } from "../services/quotationApi";
import "./CreateQuotation.css";
import "../components/QuotationForm.css";
import "../components/QuotationPreview.css";

const initialValues = {
  organizationName: "",
  validationDate: "",
  selectedModules: [],
  quotationTo: { name: "", address: "", contactNo: "", email: "" }
};

export default function CreateQuotation({ onNavigate }) {
  const [modules, setModules] = useState([]);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchModules()
      .then(setModules)
      .catch(() => setApiError("Could not load the module list. Is the API running?"));
  }, []);

  const handleFieldChange = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleQuotationToChange = (field, value) => {
    setValues((v) => ({ ...v, quotationTo: { ...v.quotationTo, [field]: value } }));
  };

  const handleToggleModule = (moduleName) => {
    setValues((v) => {
      const exists = v.selectedModules.includes(moduleName);
      return {
        ...v,
        selectedModules: exists
          ? v.selectedModules.filter((m) => m !== moduleName)
          : [...v.selectedModules, moduleName]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setApiError("");
    setResult(null);
    try {
      const payload = {
        validationDate: values.validationDate,
        organizationName: values.organizationName,
        selectedModules: values.selectedModules,
        quotationTo: {
          name: values.quotationTo.name,
          address: values.quotationTo.address,
          contactNo: values.quotationTo.contactNo,
          email: values.quotationTo.email
        }
      };
      const data = await generateQuotation(payload);
      setResult(data);
      sessionStorage.setItem("quotationData", JSON.stringify(data));
      sessionStorage.setItem("quotationFormValues", JSON.stringify(values));
    } catch (err) {
      setApiError(
        err.response?.data?.error || "Something went wrong while generating the quotation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = () => {
    onNavigate("quotation");
  };

  const handleNewQuotation = () => {
    setValues(initialValues);
    setResult(null);
    setErrors({});
    setApiError("");
    sessionStorage.removeItem("quotationData");
    sessionStorage.removeItem("quotationFormValues");
  };

  return (
    <div className="app-main">
      <div className="create-quotation__intro">
        <h2>New quotation</h2>
        <p>Fill in the client details and pick the modules in scope — everything else follows the standard BlechTek format.</p>
      </div>

      <div className="create-quotation__layout">
        <div className="create-quotation__card">
          <form className="q-form" onSubmit={handleSubmit} noValidate>
            <section className="q-form__section">
              <h3 className="q-form__heading">Quotation details</h3>
              <div className="q-form__row">
                <div className="q-field">
                  <label htmlFor="organizationName">Organization name</label>
                  <input
                    id="organizationName"
                    type="text"
                    placeholder="e.g. Vantage Auto Components Pvt. Ltd."
                    value={values.organizationName}
                    onChange={(e) => handleFieldChange("organizationName", e.target.value)}
                  />
                  {errors.organizationName && <span className="q-field__error">{errors.organizationName}</span>}
                </div>
                <div className="q-field q-field--narrow">
                  <label htmlFor="validationDate">Valid until</label>
                  <input
                    id="validationDate"
                    type="date"
                    value={values.validationDate}
                    onChange={(e) => handleFieldChange("validationDate", e.target.value)}
                  />
                  {errors.validationDate && <span className="q-field__error">{errors.validationDate}</span>}
                </div>
              </div>
            </section>

            <section className="q-form__section">
              <h3 className="q-form__heading">Quotation to</h3>
              <div className="q-form__row">
                <div className="q-field">
                  <label htmlFor="contactName">Contact name</label>
                  <input
                    id="contactName"
                    type="text"
                    placeholder="e.g. Rakesh Sharma"
                    value={values.quotationTo.name}
                    onChange={(e) => handleQuotationToChange("name", e.target.value)}
                  />
                  {errors.contactName && <span className="q-field__error">{errors.contactName}</span>}
                </div>
                <div className="q-field">
                  <label htmlFor="contactNo">Contact number</label>
                  <input
                    id="contactNo"
                    type="tel"
                    placeholder="+91 98815 50000"
                    value={values.quotationTo.contactNo}
                    onChange={(e) => handleQuotationToChange("contactNo", e.target.value)}
                  />
                  {errors.contactNo && <span className="q-field__error">{errors.contactNo}</span>}
                </div>
              </div>

              <div className="q-field">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  rows={2}
                  placeholder="Full postal address"
                  value={values.quotationTo.address}
                  onChange={(e) => handleQuotationToChange("address", e.target.value)}
                />
                {errors.contactAddress && <span className="q-field__error">{errors.contactAddress}</span>}
              </div>

              <div className="q-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={values.quotationTo.email}
                  onChange={(e) => handleQuotationToChange("email", e.target.value)}
                />
                {errors.email && <span className="q-field__error">{errors.email}</span>}
              </div>
            </section>

            <section className="q-form__section">
              <h3 className="q-form__heading">Scope & modules</h3>
              <p className="q-form__hint">
                Only the modules checked here will appear in the generated quotation's Scope section.
              </p>
              <ModuleSelector
                modules={modules}
                selected={values.selectedModules}
                onToggle={handleToggleModule}
                error={errors.selectedModules}
              />
            </section>

            <button type="submit" className="q-submit" disabled={submitting}>
              {submitting ? "Generating quotation…" : "Generate quotation"}
            </button>
          </form>
        </div>

        <aside className="q-preview">
          <div className="q-ticket">
            <div className="q-ticket__top">
              <span className="q-ticket__brand">BlechTek</span>
              <span className="q-ticket__type">Quotation</span>
            </div>

            <div className="q-ticket__body">
              <p className="q-ticket__label">Prepared for</p>
              <p className="q-ticket__value">{values.organizationName || "Organization name"}</p>

              <p className="q-ticket__label">Attention</p>
              <p className="q-ticket__value">{values.quotationTo.name || "Contact name"}</p>

              <p className="q-ticket__label">Scope</p>
              <div className="q-ticket__modules">
                {values.selectedModules.length === 0 && <span className="q-ticket__placeholder">No modules selected yet</span>}
                {values.selectedModules.map((m) => (
                  <span className="q-ticket__module" key={m}>{m}</span>
                ))}
              </div>
            </div>

            <div className="q-ticket__perforation" aria-hidden="true" />

            <div className="q-ticket__stub">
              <div>
                <p className="q-ticket__label">Valid until</p>
                <p className="q-ticket__mono">{formatDate(values.validationDate)}</p>
              </div>
              <div>
                <p className="q-ticket__label">Modules</p>
                <p className="q-ticket__mono">{String(values.selectedModules.length).padStart(2, "0")}</p>
              </div>
            </div>
          </div>

          {apiError && <div className="q-preview__error">{apiError}</div>}

          {result && (
            <div className="q-result">
              <p className="q-result__title">Quotation generated</p>
              <p className="q-result__id">{result.quotationId}</p>
              <div className="q-result__actions">
                <button
                  className="q-result__btn q-result__btn--view"
                  onClick={handleViewDetails}
                >
                  View Details
                </button>
                <button
                  className="q-result__btn q-result__btn--primary"
                  onClick={() => window.open(resolveDownloadUrl(result.pdfDownloadUrl), "_blank")}
                >
                  Download PDF
                </button>
                <button
                  className="q-result__btn"
                  onClick={() => window.open(resolveDownloadUrl(result.wordDownloadUrl), "_blank")}
                >
                  Download Word
                </button>
              </div>
            </div>
          )}

          {!result && !apiError && (
            <div className="q-preview__hint">
              <p>Complete the form and click "Generate quotation" to see download options.</p>
            </div>
          )}

          {result && (
            <button className="q-result__btn q-result__btn--secondary q-result__btn--full" onClick={handleNewQuotation}>
              New Quotation
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

function ModuleSelector({ modules, selected, onToggle, error }) {
  const grouped = modules.reduce((acc, { pillar, module }) => {
    if (!acc[pillar]) acc[pillar] = [];
    acc[pillar].push(module);
    return acc;
  }, {});

  return (
    <div className="module-selector">
      {error && <div className="module-selector__error">{error}</div>}
      <div className="module-selector__groups">
        {Object.entries(grouped).map(([pillar, modules]) => (
          <div key={pillar} className="module-selector__group">
            <h4 className="module-selector__pillar">{pillar}</h4>
            <div className="module-selector__modules">
              {modules.map((module) => (
                <label key={module} className="module-selector__item">
                  <input
                    type="checkbox"
                    checked={selected.includes(module)}
                    onChange={() => onToggle(module)}
                  />
                  <span>{module}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function validate(values) {
  const errors = {};
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^\+?[\d\s-]{7,15}$/;
  
  if (!values.organizationName.trim()) errors.organizationName = "Organization name is required.";
  if (!values.validationDate) errors.validationDate = "Pick a validity date.";
  if (values.selectedModules.length === 0) errors.selectedModules = "Select at least one module.";
  if (!values.quotationTo.name.trim()) errors.contactName = "Contact name is required.";
  if (!values.quotationTo.address.trim()) errors.contactAddress = "Address is required.";
  if (!PHONE_RE.test(values.quotationTo.contactNo.trim())) errors.contactNo = "Enter a valid phone number.";
  if (!EMAIL_RE.test(values.quotationTo.email.trim())) errors.email = "Enter a valid email address.";
  return errors;
}
