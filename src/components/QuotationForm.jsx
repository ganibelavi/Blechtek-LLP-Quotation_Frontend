import React from "react";
import ModuleSelector from "./ModuleSelector";
import "./QuotationForm.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,15}$/;

export function validate(values) {
  const errors = {};
  if (!values.organizationName.trim()) errors.organizationName = "Organization name is required.";
  if (!values.validationDate) errors.validationDate = "Pick a validity date.";
  if (values.selectedModules.length === 0) errors.selectedModules = "Select at least one module.";
  if (!values.quotationTo.name.trim()) errors.contactName = "Contact name is required.";
  if (!values.quotationTo.address.trim()) errors.contactAddress = "Address is required.";
  if (!PHONE_RE.test(values.quotationTo.contactNo.trim())) errors.contactNo = "Enter a valid phone number.";
  if (!EMAIL_RE.test(values.quotationTo.email.trim())) errors.email = "Enter a valid email address.";
  return errors;
}

export default function QuotationForm({
  values,
  errors,
  modules,
  onFieldChange,
  onQuotationToChange,
  onToggleModule,
  onSubmit,
  submitting
}) {
  return (
    <form className="q-form" onSubmit={onSubmit} noValidate>
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
              onChange={(e) => onFieldChange("organizationName", e.target.value)}
            />
            {errors.organizationName && <span className="q-field__error">{errors.organizationName}</span>}
          </div>
          <div className="q-field q-field--narrow">
            <label htmlFor="validationDate">Valid until</label>
            <input
              id="validationDate"
              type="date"
              value={values.validationDate}
              onChange={(e) => onFieldChange("validationDate", e.target.value)}
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
              onChange={(e) => onQuotationToChange("name", e.target.value)}
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
              onChange={(e) => onQuotationToChange("contactNo", e.target.value)}
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
            onChange={(e) => onQuotationToChange("address", e.target.value)}
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
            onChange={(e) => onQuotationToChange("email", e.target.value)}
          />
          {errors.email && <span className="q-field__error">{errors.email}</span>}
        </div>
      </section>

      <section className="q-form__section">
        <h3 className="q-form__heading">Scope &amp; modules</h3>
        <p className="q-form__hint">
          Only the modules checked here will appear in the generated quotation's Scope section.
        </p>
        <ModuleSelector
          modules={modules}
          selected={values.selectedModules}
          onToggle={onToggleModule}
          error={errors.selectedModules}
        />
      </section>

      <button type="submit" className="q-submit" disabled={submitting}>
        {submitting ? "Generating quotation…" : "Generate quotation"}
      </button>
    </form>
  );
}
