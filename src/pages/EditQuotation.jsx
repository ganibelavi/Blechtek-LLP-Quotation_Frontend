import React, { useEffect, useState } from "react";
import {
  fetchModules,
  updateDiscount,
  updateQuotation,
  resolveDownloadUrl,
} from "../services/quotationApi";
import "./CreateQuotation.css";
import "../components/QuotationForm.css";
import "../components/QuotationPreview.css";
import {
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import CustomSnackbar from "../components/CustomSnackbar";
import { sendQuotationEmail } from "../services/quotationApi";
const initialValues = {
  referenceBy: "",
  organizationName: "",
  validationDate: "",
  quotationNo: "",
  date: "",
  selectedModules: [],
  quotationTo: { name: "", address: "", contactNo: "", email: "" },
  discountPercentage: 0,
};

export default function EditQuotation({ onNavigate, quotationId }) {
  const [modules, setModules] = useState([]);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [result, setResult] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDiscount, setConfirmDiscount] = useState(0);
  const [discountChanged, setDiscountChanged] = useState(false);
  const [detailsChanged, setDetailsChanged] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Light grey background for disabled/readonly fields
  const disabledFieldStyle = {
    backgroundColor: "#f5f5f5",
    color: "#666",
    cursor: "not-allowed",
  };

  useEffect(() => {
    const storedResult = sessionStorage.getItem("quotationData");
    const storedValues = sessionStorage.getItem("quotationFormValues");
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
      } catch (e) {
        console.error("Failed to parse quotation data", e);
      }
    }
    if (storedValues) {
      try {
        setValues(JSON.parse(storedValues));
      } catch (e) {
        console.error("Failed to parse form values", e);
      }
    }
    fetchModules()
      .then(setModules)
      .catch((err) => {
        const msg = "Could not load the module list. Is the API running?";
        setApiError(msg);
        setSnackbar({ open: true, message: msg, severity: "error" });
      });
  }, []);

  const handleFieldChange = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleQuotationToChange = (field, value) => {
    setValues((v) => ({
      ...v,
      quotationTo: { ...v.quotationTo, [field]: value },
    }));
  };

  const handleToggleModule = (moduleName) => {
    setValues((v) => {
      const exists = v.selectedModules.includes(moduleName);
      return {
        ...v,
        selectedModules: exists
          ? v.selectedModules.filter((m) => m !== moduleName)
          : [...v.selectedModules, moduleName],
      };
    });
  };

  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    handleFieldChange("discountPercentage", value);
    setDiscountChanged(true);
  };

  const handleConfirmDiscount = () => {
    setShowConfirmDialog(true);
    setConfirmDiscount(values.discountPercentage);
  };

  const handleConfirmDialogClose = () => {
    setShowConfirmDialog(false);
  };

  const handleConfirmApply = async () => {
    setShowConfirmDialog(false);
    setSubmitting(true);
    setApiError("");
    try {
      const data = await updateDiscount(result.quotationId, confirmDiscount);
      setResult(data);
      sessionStorage.setItem("quotationData", JSON.stringify(data));
      sessionStorage.setItem(
        "quotationFormValues",
        JSON.stringify({ ...values, discountPercentage: confirmDiscount }),
      );
      setDiscountChanged(false);
      setSnackbar({
        open: true,
        message: "Quotation updated successfully!",
        severity: "success",
      });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Something went wrong while updating the discount.";
      setApiError(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
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
    onNavigate("create");
  };

  const handleBack = () => {
    onNavigate("settings", "created-quotations");
  };

  const handleSaveDetails = async () => {
    if (!result?.quotationId) return;
    if (!values.selectedModules || values.selectedModules.length === 0) {
      setSnackbar({
        open: true,
        message: "Please select at least one module.",
        severity: "error",
      });
      return;
    }
    setSubmitting(true);
    setApiError("");
    try {
      const payload = {
        validationDate: values.validationDate,
        selectedModules: values.selectedModules,
      };
      const data = await updateQuotation(result.quotationId, payload);
      setResult(data);
      sessionStorage.setItem("quotationData", JSON.stringify(data));
      sessionStorage.setItem("quotationFormValues", JSON.stringify(values));
      setDetailsChanged(false);
      setSnackbar({
        open: true,
        message: "Quotation details updated successfully!",
        severity: "success",
      });
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to update quotation details.";
      setApiError(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-quotation edit-quotation">
      <div className="create-quotation__header">
        <div className="create-quotation__title">
          <h2>Edit Quotation</h2>
          <p>Update discount percentage and regenerate the quotation.</p>
        </div>
        <button
          className="create-quotation__back-btn"
          onClick={handleBack}
          aria-label="Back to quotations list"
        >
          <svg
            className="create-quotation__back-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="create-quotation__back-text"></span>
        </button>
      </div>

      <div className="create-quotation__layout">
        <CustomSnackbar
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          message={snackbar.message}
        />
        <div className="create-quotation__card">
          <form
            className="q-form"
            onSubmit={(e) => e.preventDefault()}
            noValidate
          >
            <section className="q-form__section">
              <h3 className="q-form__heading">Quotation details</h3>
              <div className="q-form__row">
                <div className="q-field">
                  <label htmlFor="referenceBy">Reference By</label>
                  <input
                    id="referenceBy"
                    type="text"
                    placeholder="e.g. John Smith / Internal"
                    value={values.referenceBy}
                    onChange={(e) =>
                      handleFieldChange("referenceBy", e.target.value)
                    }
                    readOnly
                    style={disabledFieldStyle}
                  />
                  {errors.referenceBy && (
                    <span className="q-field__error">{errors.referenceBy}</span>
                  )}
                </div>
                <div className="q-field q-field--narrow">
                  <label htmlFor="validationDate">Valid until</label>
                  <input
                    id="validationDate"
                    type="date"
                    value={values.validationDate}
                    onChange={(e) => {
                      handleFieldChange("validationDate", e.target.value);
                      setDetailsChanged(true);
                    }}
                  />
                  {errors.validationDate && (
                    <span className="q-field__error">
                      {errors.validationDate}
                    </span>
                  )}
                </div>
              </div>
              <div className="q-form__row">
                <div className="q-field">
                  <label htmlFor="organizationName">Organization name</label>
                  <input
                    id="organizationName"
                    type="text"
                    placeholder="e.g. Vantage Auto Components Pvt. Ltd."
                    value={values.organizationName}
                    onChange={(e) =>
                      handleFieldChange("organizationName", e.target.value)
                    }
                    readOnly
                    style={disabledFieldStyle}
                  />
                  {errors.organizationName && (
                    <span className="q-field__error">
                      {errors.organizationName}
                    </span>
                  )}
                </div>
                {/* <div className="q-field q-field--narrow">
                  <label htmlFor="validationDate">Valid until</label>
                  <input
                    id="validationDate"
                    type="date"
                    value={values.validationDate}
                    onChange={(e) =>
                      handleFieldChange("validationDate", e.target.value)
                    }
                    readOnly
                    style={disabledFieldStyle}
                  />
                  {errors.validationDate && (
                    <span className="q-field__error">
                      {errors.validationDate}
                    </span>
                  )}
                </div> */}
              </div>
              <div className="q-form__row">
                <div className="q-field">
                  <label htmlFor="quotationNo">Quotation No.</label>
                  <input
                    id="quotationNo"
                    type="text"
                    placeholder="e.g. Q-2026-001"
                    value={values.quotationNo}
                    onChange={(e) =>
                      handleFieldChange("quotationNo", e.target.value)
                    }
                    readOnly
                    style={disabledFieldStyle}
                  />
                  {errors.quotationNo && (
                    <span className="q-field__error">{errors.quotationNo}</span>
                  )}
                </div>
                <div className="q-field q-field--narrow">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={values.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    readOnly
                    style={disabledFieldStyle}
                  />
                  {errors.date && (
                    <span className="q-field__error">{errors.date}</span>
                  )}
                </div>
                <div className="q-field q-field--narrow">
                  <label htmlFor="discountPercentage">Discount %</label>
                  <input
                    id="discountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g. 10"
                    value={values.discountPercentage}
                    onChange={handleDiscountChange}
                  />
                  {errors.discountPercentage && (
                    <span className="q-field__error">
                      {errors.discountPercentage}
                    </span>
                  )}
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
                    onChange={(e) =>
                      handleQuotationToChange("name", e.target.value)
                    }
                    readOnly
                    style={disabledFieldStyle}
                  />
                  {errors.contactName && (
                    <span className="q-field__error">{errors.contactName}</span>
                  )}
                </div>
                <div className="q-field">
                  <label htmlFor="contactNo">Contact number</label>
                  <input
                    id="contactNo"
                    type="tel"
                    placeholder="+91 98815 50000"
                    value={values.quotationTo.contactNo}
                    onChange={(e) =>
                      handleQuotationToChange("contactNo", e.target.value)
                    }
                    readOnly
                    style={disabledFieldStyle}
                  />
                  {errors.contactNo && (
                    <span className="q-field__error">{errors.contactNo}</span>
                  )}
                </div>
              </div>

              <div className="q-form__row">
                <div className="q-field">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    rows={2}
                    placeholder="Full postal address"
                    value={values.quotationTo.address}
                    onChange={(e) =>
                      handleQuotationToChange("address", e.target.value)
                    }
                    readOnly
                    style={disabledFieldStyle}
                  />
                  {errors.contactAddress && (
                    <span className="q-field__error">
                      {errors.contactAddress}
                    </span>
                  )}
                </div>
                <div className="q-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={values.quotationTo.email}
                    onChange={(e) =>
                      handleQuotationToChange("email", e.target.value)
                    }
                    readOnly
                    style={disabledFieldStyle}
                  />
                  {errors.email && (
                    <span className="q-field__error">{errors.email}</span>
                  )}
                </div>
              </div>
            </section>

            <section className="q-form__section">
              <h3 className="q-form__heading">Scope & modules</h3>
              <p className="q-form__hint">
                Modules selected in this quotation.
              </p>
              <ModuleSelector
                modules={modules}
                selected={values.selectedModules}
                onToggle={(moduleName) => {
                  handleToggleModule(moduleName);
                  setDetailsChanged(true);
                }}
                error={errors.selectedModules}
                readOnly={false}
              />
            </section>

            {discountChanged && (
              <div
                className="q-form__row"
                style={{ justifyContent: "flex-end", marginTop: "16px" }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleConfirmDiscount}
                  disabled={submitting}
                  style={{ fontSize: "13px" }}
                >
                  {submitting ? "Applying…" : "Apply Discount"}
                </Button>
              </div>
            )}

            {detailsChanged && (
              <div
                className="q-form__row"
                style={{ justifyContent: "flex-end", marginTop: "16px" }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleSaveDetails}
                  disabled={submitting}
                  style={{ fontSize: "13px" }}
                >
                  {submitting ? "Saving…" : "Save Details"}
                </Button>
              </div>
            )}

            {!discountChanged && result && (
              <div
                className="q-form__row"
                style={{ justifyContent: "flex-end", marginTop: "16px" }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() =>
                    handleFieldChange(
                      "discountPercentage",
                      values.discountPercentage,
                    )
                  }
                  disabled={submitting}
                  style={{ fontSize: "13px" }}
                >
                  Edit Discount
                </Button>
              </div>
            )}
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
              <p className="q-ticket__value">
                {values.organizationName || "Organization name"}
              </p>

              <p className="q-ticket__label">Reference By</p>
              <p className="q-ticket__value">{values.referenceBy || "—"}</p>

              <p className="q-ticket__label">Attention</p>
              <p className="q-ticket__value">
                {values.quotationTo.name || "Contact name"}
              </p>

              <p className="q-ticket__label">Scope</p>
              <div className="q-ticket__modules">
                {values.selectedModules.length === 0 && (
                  <span className="q-ticket__placeholder">
                    No modules selected yet
                  </span>
                )}
                {values.selectedModules.map((m) => (
                  <span className="q-ticket__module" key={m}>
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="q-ticket__perforation" aria-hidden="true" />

            <div className="q-ticket__stub">
              <div>
                <p className="q-ticket__label">Valid until</p>
                <p className="q-ticket__mono">
                  {formatDate(values.validationDate)}
                </p>
              </div>
              <div>
                <p className="q-ticket__label">Modules</p>
                <p className="q-ticket__mono">
                  {String(values.selectedModules.length).padStart(2, "0")}
                </p>
              </div>
              <div>
                <p className="q-ticket__label">Discount %</p>
                <p className="q-ticket__mono">{values.discountPercentage}%</p>
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
                  className="q-result__btn q-result__btn--primary"
                  onClick={handleViewDetails}
                >
                  View Details
                </button>
                <button
                  className="q-result__btn q-result__btn--primary"
                  onClick={() => {
                    const url = resolveDownloadUrl(result.pdfDownloadUrl);
                    if (url) window.open(url, "_blank");
                  }}
                >
                  Download PDF
                </button>
                {/* <button
                  className="q-result__btn q-result__btn--primary"
                  onClick={() => {
                    const url = resolveDownloadUrl(result.wordDownloadUrl);
                    if (url) window.open(url, "_blank");
                  }}
                >
                  Download Word
                </button> */}
                <button
                  className="q-result__btn q-result__btn--primary"
                  onClick={() => {
                    setEmailRecipient(values.quotationTo.email || "");
                    setEmailSubject(`Quotation ${result.quotationId}`);
                    setEmailMessage("Please find attached the quotation.");
                    setEmailDialogOpen(true);
                  }}
                >
                  Send Email
                </button>
              </div>
            </div>
          )}

          {!result && !apiError && (
            <div className="q-preview__hint">
              <p>
                Edit the discount percentage and click "Apply Discount" to
                regenerate the quotation.
              </p>
            </div>
          )}
        </aside>
      </div>

      <Dialog
        open={showConfirmDialog}
        onClose={handleConfirmDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(120deg, #308aea 0%, #48cae4 100%)",
            color: "white",
            px: 3,
            py: 2,
            mb: 2,
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
          }}
        >
          Confirm Discount Update
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ color: "black" }}>
            You are about to update the discount to{" "}
            <strong>{confirmDiscount}%</strong>. This will regenerate the PDF
            and Word documents with the new discount applied.
          </Alert>
          <TextField
            label="Discount %"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={confirmDiscount}
            onChange={(e) =>
              setConfirmDiscount(parseFloat(e.target.value) || 0)
            }
            fullWidth
            margin="normal"
            inputProps={{ style: { textAlign: "right" } }}
            InputProps={{
              endAdornment: <span style={{ marginLeft: 8 }}>%</span>,
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleConfirmDialogClose}
            sx={{
              bgcolor: "#757575",
              color: "white",
              "&:hover": { bgcolor: "#757575" },
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApply}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? "Applying…" : "Confirm & Generate"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
        }}
      >
        <DialogTitle
          sx={{
            position: "relative",
            background: "linear-gradient(120deg, #308aea 0%, #48cae4 100%)",
            color: "white",
            px: 3,
            py: 2,
            mb: 2,
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
          }}
        >
          Send quotation by email
          <button
            aria-label="Close"
            onClick={() => setEmailDialogOpen(false)}
            style={{
              position: "absolute",
              right: 12,
              top: 8,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "block" }}
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Recipient email"
            type="email"
            fullWidth
            value={emailRecipient}
            onChange={(e) => setEmailRecipient(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Subject"
            fullWidth
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Message"
            fullWidth
            multiline
            minRows={3}
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions
          sx={{ justifyContent: "flex-end", gap: 1, p: "16px 24px" }}
        >
          <Button
            onClick={() => setEmailDialogOpen(false)}
            sx={{
              bgcolor: "#757575",
              color: "white",
              "&:hover": { bgcolor: "#757575" },
              textTransform: "none",
              borderRadius: 2,
              px: 2,
              py: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={sendingEmail}
            onClick={async () => {
              if (!emailRecipient) {
                setSnackbar({
                  open: true,
                  message: "Please enter recipient email.",
                  severity: "error",
                });
                return;
              }
              setSendingEmail(true);
              try {
                await sendQuotationEmail(result.quotationId, {
                  recipientEmail: emailRecipient,
                  subject: emailSubject,
                  message: emailMessage,
                  attachPdf: true,
                });
                setSnackbar({
                  open: true,
                  message: "Email sent successfully.",
                  severity: "success",
                });
                setEmailDialogOpen(false);
              } catch (err) {
                const msg =
                  err.response?.data?.error || "Failed to send email.";
                setSnackbar({ open: true, message: msg, severity: "error" });
              } finally {
                setSendingEmail(false);
              }
            }}
            sx={{
              background: "linear-gradient(120deg,#308aea 0%,#48cae4 100%)",
              color: "white",
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              py: 1,
              boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "translateY(-1px)",
              },
            }}
          >
            {sendingEmail ? "Sending…" : "Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function ModuleSelector({ modules, selected, onToggle, error, readOnly }) {
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
                    onChange={() => !readOnly && onToggle(module)}
                    disabled={readOnly}
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
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
