import React, { useEffect, useState } from "react";
import {
  fetchModules,
  generateQuotation,
  resolveDownloadUrl,
  fetchNextQuotationNo,
  fetchReferences,
  fetchCustomers,
  createCustomer,
  createReference,
  fetchQuotationById,
  linkRenewalQuotation,
} from "../../services/quotationApi";
import "./CreateQuotation.css";
import "../../components/QuotationForm.css";
import "../../components/QuotationPreview.css";
import CustomSnackbar from "../../components/CustomSnackbar";
import SearchDropdown from "../../components/SearchDropdown";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { sendQuotationEmail } from "../../services/quotationApi";

const today = new Date().toISOString().split("T")[0];
const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

const initialValues = {
  referenceBy: "",
  organizationName: "",
  validationDate: thirtyDaysLater,
  quotationNo: "",
  date: today,
  selectedModules: [],
  moduleRequirements: {},
  additionalScopes: [],
  quotationTo: { name: "", address: "", contactNo: "", email: "" },
  discountPercentage: 0,
};

const normalizeQuotationValues = (candidate = {}) => ({
  ...initialValues,
  ...candidate,
  selectedModules: Array.isArray(candidate.selectedModules)
    ? candidate.selectedModules
    : initialValues.selectedModules,
  moduleRequirements: candidate.moduleRequirements || {},
  additionalScopes: Array.isArray(candidate.additionalScopes)
    ? candidate.additionalScopes.map((scope) => ({
        requirement: scope.requirement ?? scope.Requirement ?? "",
        module:
          scope.module ?? scope.modules ?? scope.Modules ?? "",
        manPower:
          scope.manPower ?? scope.noOfManpower ?? scope.NoOfManpower ?? "",
        days: scope.days ?? scope.noOfDays ?? scope.NoOfDays ?? "",
        rate: scope.rate ?? scope.Rate ?? "",
        amount: scope.amount ?? scope.Amount ?? "",
      }))
    : [],
  quotationTo: {
    ...initialValues.quotationTo,
    ...(candidate.quotationTo || {}),
  },
});

const getCustomerContactName = (customer) =>
  customer?.contactName ??
  customer?.ContactName ??
  customer?.name ??
  customer?.Name ??
  "";

const getCustomerAddress = (customer) =>
  customer?.address ?? customer?.Address ?? "";

const getCustomerContactNumber = (customer) =>
  customer?.contactNumber ?? customer?.ContactNumber ?? "";

const getCustomerEmail = (customer) => customer?.email ?? customer?.Email ?? "";

export default function CreateQuotation({
  onNavigate,
  readOnly = false,
  editMode = false,
}) {
  const [modules, setModules] = useState([]);
  const [references, setReferences] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [validityPeriod, setValidityPeriod] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [result, setResult] = useState(null);
  const [loadingQuotationNo, setLoadingQuotationNo] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    address: "",
    state: "",
    stateCode: "",
    gstn: "",
    contactName: "",
    contactNumber: "",
    email: "",
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [newReference, setNewReference] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [savingReference, setSavingReference] = useState(false);

  useEffect(() => {
    if (readOnly || editMode) {
      setLoadingQuotationNo(false);
      const storedResult = sessionStorage.getItem("quotationData");
      const storedValues = sessionStorage.getItem("quotationFormValues");
      let quotationId = "";
      if (storedResult) {
        try {
          const parsedResult = JSON.parse(storedResult);
          setResult(parsedResult);
          quotationId =
            parsedResult.quotationId || parsedResult.QuotationId || "";
        } catch (error) {
          console.error("Failed to parse quotation data", error);
        }
      }
      if (storedValues) {
        try {
          setValues(normalizeQuotationValues(JSON.parse(storedValues)));
        } catch (error) {
          console.error("Failed to parse quotation form values", error);
        }
      }

      if (quotationId) {
        fetchQuotationById(quotationId)
          .then((quotation) => {
            if (!quotation) return;

            const selectedModules = (
              quotation.modules ||
              quotation.Modules ||
              []
            ).map((moduleName) => String(moduleName).trim());
            const savedModuleDetails =
              quotation.moduleDetails || quotation.ModuleDetails || [];
            const moduleRequirements = savedModuleDetails.reduce(
              (requirements, detail) => {
                const moduleName = String(
                  detail.moduleName || detail.ModuleName || "",
                ).trim();
                if (!moduleName) return requirements;

                return {
                  ...requirements,
                  [moduleName]: {
                    noOfUsers: detail.noOfUsers ?? detail.NoOfUsers ?? "",
                    noOfInstallations:
                      detail.noOfInstallations ??
                      detail.NoOfInstallations ??
                      "",
                    noOfSites: detail.noOfSites ?? detail.NoOfSites ?? "",
                    implementationEffortUnit:
                      detail.implementationEffortUnit ??
                      detail.ImplementationEffortUnit ??
                      "",
                  },
                };
              },
              {},
            );

            setValues((current) => normalizeQuotationValues({
              ...current,
              organizationName:
                quotation.organizationName || current.organizationName,
              referenceBy: quotation.referenceBy || current.referenceBy,
              quotationNo: quotation.quotationNo || current.quotationNo,
              date: quotation.date
                ? quotation.date.slice(0, 10)
                : current.date,
              validationDate: quotation.validationDate
                ? quotation.validationDate.slice(0, 10)
                : current.validationDate,
              selectedModules,
              moduleRequirements,
              additionalScopes:
                quotation.additionalScopes ||
                quotation.AdditionalScopes ||
                current.additionalScopes,
              quotationTo: {
                name: quotation.quotationToName || current.quotationTo.name,
                address:
                  quotation.quotationToAddress || current.quotationTo.address,
                contactNo:
                  quotation.quotationToContactNo ||
                  current.quotationTo.contactNo,
                email: quotation.quotationToEmail || current.quotationTo.email,
              },
              discountPercentage: quotation.discountPercentage || 0,
            }));
          })
          .catch((error) => {
            console.error("Failed to load saved quotation for viewing", error);
            setApiError("Could not load the saved quotation details.");
          });
      }
    }

    fetchModules()
      .then(setModules)
      .catch(() =>
        setApiError("Could not load the module list. Is the API running?"),
      );

    if (readOnly) return;

    fetchReferences()
      .then(setReferences)
      .catch(() => setReferences([]));

    fetchCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]));

    // Check for revision source quotation
    const revisionSourceQuotationId = sessionStorage.getItem(
      "revisionSourceQuotationId",
    );
    if (revisionSourceQuotationId) {
      fetchQuotationById(revisionSourceQuotationId)
        .then((quotation) => {
          if (quotation) {
            // Pre-fill form with revision data
            const revisionValues = {
              referenceBy: quotation.referenceBy || "",
              organizationName: quotation.organizationName || "",
              validationDate: quotation.validationDate || "",
              date: quotation.date || new Date().toISOString().slice(0, 10),
              selectedModules: Array.isArray(quotation.modules)
                ? quotation.modules
                : [],
              moduleRequirements: {},
              quotationTo: {
                name: quotation.quotationToName || "",
                address: quotation.quotationToAddress || "",
                contactNo: quotation.quotationToContactNo || "",
                email: quotation.quotationToEmail || "",
              },
              discountPercentage: quotation.discountPercentage || 0,
            };
            setValues(revisionValues);
            setSnackbar({
              open: true,
              message: `Loaded quotation ${quotation.quotationNo} as revision base. Reason: ${sessionStorage.getItem("revisionReason") || "Revision"}`,
              severity: "info",
            });
            sessionStorage.removeItem("revisionSourceQuotationId");
            sessionStorage.removeItem("revisionReason");
          }

        })
        .catch((error) => {
          console.error("Failed to load revision source quotation", error);
          sessionStorage.removeItem("revisionSourceQuotationId");
          sessionStorage.removeItem("revisionReason");
        });
    }

    const renewalContextRaw = sessionStorage.getItem("renewalQuotationContext");
    if (renewalContextRaw) {
      try {
        const renewal = JSON.parse(renewalContextRaw);
        setValues((current) => normalizeQuotationValues({
          ...current,
          organizationName: renewal.customerName || current.organizationName,
          validationDate: renewal.periodStart || current.validationDate,
          date: renewal.periodStart || current.date,
          selectedModules: renewal.moduleName
            ? [renewal.moduleName]
            : current.selectedModules,
          moduleRequirements: renewal.moduleName
            ? {
                ...current.moduleRequirements,
                [renewal.moduleName]: {
                  ...(current.moduleRequirements?.[renewal.moduleName] || {}),
                  modulePriceOverride: renewal.amount,
                },
              }
            : current.moduleRequirements,
          quotationTo: {
            name: renewal.customerName || current.quotationTo.name,
            address: renewal.customerAddress || current.quotationTo.address,
            contactNo:
              renewal.customerContactNumber || current.quotationTo.contactNo,
            email: renewal.customerEmail || current.quotationTo.email,
          },
        }));
      } catch (error) {
        console.error("Failed to load renewal quotation context", error);
        sessionStorage.removeItem("renewalQuotationContext");
      }
    }

    if (editMode) return;

    // Fetch the next quotation number
    fetchNextQuotationNo()
      .then((quotationNo) => {
        setValues((v) => ({ ...v, quotationNo }));
        setLoadingQuotationNo(false);
      })
      .catch(() => {
        setValues((v) => ({ ...v, quotationNo: "Auto-generated" }));
        setLoadingQuotationNo(false);
      });
  }, [readOnly, editMode]);

  useEffect(() => {
    if (values.date && values.validationDate) {
      const days = getDaysBetween(values.date, values.validationDate);
      if (days && days !== validityPeriod) {
        setValidityPeriod(days);
      }
    }
  }, [values.date, values.validationDate, validityPeriod]);

  const handleFieldChange = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (field === "date" && validityPeriod) {
      calculateValidationDate(value, validityPeriod);
    }
  };

  const handleOrganizationChange = (organizationName) => {
    const selectedCustomer = customers.find(
      (customer) =>
        String(customer.name ?? customer.Name ?? "").trim().toLowerCase() ===
        organizationName.trim().toLowerCase(),
    );

    setValues((current) => ({
      ...current,
      organizationName,
      quotationTo: selectedCustomer
        ? {
            name: getCustomerContactName(selectedCustomer),
            address: getCustomerAddress(selectedCustomer),
            contactNo: getCustomerContactNumber(selectedCustomer),
            email: getCustomerEmail(selectedCustomer),
          }
        : current.quotationTo,
    }));
  };

  const calculateValidationDate = (dateStr, days) => {
    if (!dateStr) return;
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    const formattedDate = date.toISOString().split("T")[0];
    setValues((v) => ({ ...v, validationDate: formattedDate }));
  };

  const handleValidityPeriodChange = (e) => {
    const days = Number(e.target.value);
    setValidityPeriod(days);
    if (values.date) {
      calculateValidationDate(values.date, days);
    }
  };

  const handleAddNewOrganization = () => {
    setNewCustomer({
      name: "",
      address: "",
      state: "",
      stateCode: "",
      gstn: "",
      contactName: "",
      contactNumber: "",
      email: "",
    });
    setCustomerDialogOpen(true);
  };

  const handleCreateCustomer = async () => {
    const name = newCustomer.name.trim();
    if (!name) return;

    try {
      setSavingCustomer(true);
      const createdCustomer = await createCustomer({
        ...newCustomer,
        name,
      });
      const savedCustomer = createdCustomer || { name };
      setCustomers((current) => [...current, savedCustomer]);
      handleFieldChange("organizationName", savedCustomer.name || name);
      setCustomerDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.error || "Unable to add customer.",
        severity: "error",
      });
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleAddNewReference = () => {
    setNewReference({ name: "", email: "", phone: "", address: "" });
    setReferenceDialogOpen(true);
  };

  const handleCreateReference = async () => {
    const name = newReference.name.trim();
    if (!name) return;

    try {
      setSavingReference(true);
      const createdReference = await createReference({
        ...newReference,
        name,
      });
      const savedName = createdReference?.name || createdReference?.Name || name;
      setReferences((current) =>
        [...new Set([...current, savedName])].sort((first, second) =>
          first.localeCompare(second),
        ),
      );
      handleFieldChange("referenceBy", savedName);
      setReferenceDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.error || "Unable to add reference.",
        severity: "error",
      });
    } finally {
      setSavingReference(false);
    }
  };

  const handleToggleModule = (moduleName) => {
    setValues((v) => {
      const exists = v.selectedModules.includes(moduleName);
      const moduleRequirements = { ...(v.moduleRequirements || {}) };

      if (exists) {
        delete moduleRequirements[moduleName];
      } else {
        moduleRequirements[moduleName] = {
          noOfUsers: "",
          noOfInstallations: "",
          noOfSites: "",
          implementationEffortUnit: "",
        };
      }

      return {
        ...v,
        selectedModules: exists
          ? v.selectedModules.filter((m) => m !== moduleName)
          : [...v.selectedModules, moduleName],
        moduleRequirements,
      };
    });
  };

  const handleModuleRequirementChange = (moduleName, field, value) => {
    setValues((v) => ({
      ...v,
      moduleRequirements: {
        ...(v.moduleRequirements || {}),
        [moduleName]: {
          ...(v.moduleRequirements?.[moduleName] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleAdditionalScopeChange = (index, field, value) => {
    setValues((current) => ({
      ...current,
      additionalScopes: current.additionalScopes.map((scope, scopeIndex) => {
        if (scopeIndex !== index) return scope;

        const updatedScope = { ...scope, [field]: value };
        if (["manPower", "days", "rate"].includes(field)) {
          const manPower = Number(updatedScope.manPower) || 0;
          const days = Number(updatedScope.days) || 0;
          const rate = Number(updatedScope.rate) || 0;
          updatedScope.amount = manPower && days && rate
            ? manPower * days * rate
            : "";
        }
        return updatedScope;
      }),
    }));
  };

  const handleAddAdditionalScope = () => {
    setValues((current) => ({
      ...current,
      additionalScopes: [
        ...current.additionalScopes,
        {
          requirement: "",
          module: "",
          manPower: "",
          days: "",
          rate: "",
          amount: "",
        },
      ],
    }));
  };

  const handleRemoveAdditionalScope = (index) => {
    setValues((current) => ({
      ...current,
      additionalScopes: current.additionalScopes.filter(
        (_, scopeIndex) => scopeIndex !== index,
      ),
    }));
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
      const loggedInUser = (() => {
        try {
          return (
            JSON.parse(localStorage.getItem("qa_user") || "null")?.email || ""
          );
        } catch {
          return "";
        }
      })();

      const payload = {
        validationDate: values.validationDate,
        organizationName: values.organizationName,
        referenceBy: values.referenceBy,
        createdByUser: loggedInUser,
        quotationNo: "", // Auto-generated on backend
        date: values.date,
        selectedModules: values.selectedModules,
        moduleDetails: values.selectedModules.map((moduleName) => ({
          moduleName,
          noOfUsers:
            values.moduleRequirements?.[moduleName]?.noOfUsers === ""
              ? null
              : Number(values.moduleRequirements?.[moduleName]?.noOfUsers),
          noOfInstallations:
            values.moduleRequirements?.[moduleName]?.noOfInstallations === ""
              ? null
              : Number(
                  values.moduleRequirements?.[moduleName]?.noOfInstallations,
                ),
          noOfSites:
            values.moduleRequirements?.[moduleName]?.noOfSites === ""
              ? null
              : Number(values.moduleRequirements?.[moduleName]?.noOfSites),
          implementationEffortUnit:
            values.moduleRequirements?.[moduleName]
              ?.implementationEffortUnit || null,
          modulePriceOverride:
            values.moduleRequirements?.[moduleName]?.modulePriceOverride ??
            null,
        })),
        additionalScopes: values.additionalScopes
          .filter((scope) => scope.module)
          .map((scope) => ({
            requirement: scope.requirement,
            modules: scope.module,
            noOfManpower: Number(scope.manPower) || 0,
            noOfDays: Number(scope.days) || 0,
            rate: Number(scope.rate) || 0,
            amount: Number(scope.amount) || 0,
            price: Number(scope.amount) || 0,
          })),
        quotationTo: {
          name: values.quotationTo.name,
          address: values.quotationTo.address,
          contactNo: values.quotationTo.contactNo,
          email: values.quotationTo.email,
        },
        discountPercentage: values.discountPercentage,
      };
      const data = await generateQuotation(payload);
      const renewalContextRaw = sessionStorage.getItem(
        "renewalQuotationContext",
      );
      if (renewalContextRaw) {
        const renewal = JSON.parse(renewalContextRaw);
        await linkRenewalQuotation(
          renewal.renewalId,
          data.quotationId || data.QuotationId,
        );
        sessionStorage.removeItem("renewalQuotationContext");
      }
      setResult(data);
      sessionStorage.setItem("quotationData", JSON.stringify(data));
      sessionStorage.setItem("quotationFormValues", JSON.stringify(values));
      onNavigate("quotation-detail");
      setSnackbar({
        open: true,
        message: "Quotation created successfully!",
        severity: "success",
      });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Something went wrong while generating the quotation.";
      setApiError(msg);
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };
  // d

  const handleViewDetails = () => {
    onNavigate("quotation-detail");
  };

  const handleDownloadPdf = async () => {
    const quotationId = result?.quotationId || result?.QuotationId;
    const path =
      result?.pdfDownloadUrl ||
      result?.PdfDownloadUrl ||
      (quotationId
        ? `/api/quotation/${quotationId}/download/pdf`
        : "");
    const url = resolveDownloadUrl(path);

    if (!url) {
      setSnackbar({
        open: true,
        message: "PDF download link is not available.",
        severity: "error",
      });
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`PDF download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${result?.quotationNo || quotationId || "quotation"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to download quotation PDF", error);
      setSnackbar({
        open: true,
        message: "Unable to download the quotation PDF.",
        severity: "error",
      });
    }
  };

  const handleNewQuotation = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newValidationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    setValues({
      ...initialValues,
      referenceBy: "",
      quotationNo: "",
      date: todayStr,
      validationDate: newValidationDate,
    });
    setValidityPeriod(30);
    setResult(null);
    setErrors({});
    setApiError("");
    setLoadingQuotationNo(true);
    sessionStorage.removeItem("quotationData");
    sessionStorage.removeItem("quotationFormValues");
    // Fetch new quotation number
    fetchNextQuotationNo()
      .then((quotationNo) => {
        setValues((v) => ({ ...v, quotationNo }));
        setLoadingQuotationNo(false);
      })
      .catch(() => {
        setValues((v) => ({ ...v, quotationNo: "Auto-generated" }));
        setLoadingQuotationNo(false);
      });
  };

  return (
    <div
      className={`create-quotation ${readOnly ? "create-quotation--readonly" : ""}`}
    >
      <div className="create-quotation__header">
        <div className="create-quotation__title">
          <h2 className="page-heading page-heading__text">
            {readOnly ? "View Quotation" : editMode ? "Edit Quotation" : "New Quotation"}
          </h2>
          <p></p>
        </div>
        <div className="create-quotation__header-actions">
          {!readOnly && (
            <button
              type="submit"
              form="quotation-form"
              className="q-submit"
              disabled={submitting}
            >
              {submitting ? "Generating quotation…" : "Generate quotation"}
            </button>
          )}
          {result && !editMode && (
            <>
              <button
                type="button"
                className="q-result__btn q-result__btn--primary create-quotation__header-action-btn"
                onClick={handleDownloadPdf}
              >
                Download PDF
              </button>
              <button
                type="button"
                className="q-result__btn q-result__btn--primary create-quotation__header-action-btn"
                onClick={() => {
                  setEmailRecipient(values.quotationTo.email || "");
                  setEmailSubject(`Quotation ${result.quotationNo}`);
                  setEmailMessage("Please find attached the quotation.");
                  setEmailDialogOpen(true);
                }}
              >
                Send Email
              </button>
            </>
          )}
          <button
            className="create-quotation__back-btn"
            onClick={() => onNavigate("settings", "created-quotations")}
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
      </div>

      <div className="create-quotation__layout">
        <div className="create-quotation__card create-quotation__details-preview-card">
          <div className="create-quotation__details-card">
          <form
            id="quotation-form"
            className="q-form"
            onSubmit={readOnly ? undefined : handleSubmit}
            noValidate
          >
            <section className="q-form__section">
              <h3 className="q-form__heading">Quotation details</h3>
              <div className="q-form__row">
                <div className="q-field">
                  <SearchDropdown
                    name="organizationName"
                    label="Customer"
                    value={values.organizationName}
                    onChange={handleOrganizationChange}
                    disabled={readOnly}
                    options={[
                      ...new Set(
                        customers
                          .map((customer) => customer.name ?? customer.Name ?? "")
                          .map((name) => name.trim())
                          .filter(Boolean),
                      ),
                    ]}
                    placeholder="Search customer..."
                    error={errors.organizationName}
                    onAddNew={handleAddNewOrganization}
                    addNewLabel="Add new customer"
                    required
                    allowFreeText
                  />
                </div>
                <div className="q-field q-field--narrow">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={values.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    disabled={readOnly}
                    className={readOnly ? "q-field__input--readonly" : ""}
                  />
                  {errors.date && (
                    <span className="q-field__error">{errors.date}</span>
                  )}
                </div>
                <div className="q-field q-field--narrow">
                  <label htmlFor="validityPeriod">Valid for (days)</label>
                  <select
                    id="validityPeriod"
                    value={validityPeriod}
                    onChange={handleValidityPeriodChange}
                    disabled={readOnly}
                    className={readOnly ? "q-field__input--readonly" : ""}
                  >
                    <option value={15}>15 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                  </select>
                </div>
              </div>
              <div className="q-form__row">
                <div className="q-field">
                  <SearchDropdown
                    name="referenceBy"
                    label="Reference By"
                    value={values.referenceBy}
                    onChange={(val) => handleFieldChange("referenceBy", val)}
                    disabled={readOnly}
                    className={readOnly ? "q-field__input--readonly" : ""}
                    options={references}
                    placeholder="e.g. John Smith / Internal"
                    error={errors.referenceBy}
                    onAddNew={handleAddNewReference}
                    addNewLabel="Add new reference"
                    allowFreeText
                  />
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
                    disabled={readOnly}
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
                    placeholder={
                      loadingQuotationNo ? "Loading..." : "Auto-generated"
                    }
                    value={
                      values.quotationNo ||
                      (loadingQuotationNo ? "" : "Auto-generated")
                    }
                    readOnly
                    className="q-field__input--readonly"
                  />
                  {loadingQuotationNo && (
                    <span className="q-field__hint">
                      Generating quotation number…
                    </span>
                  )}
                  {errors.quotationNo && (
                    <span className="q-field__error">{errors.quotationNo}</span>
                  )}
                </div>
                
                <div className="q-field q-field--narrow">
                  <label htmlFor="validationDate">Valid until</label>
                  <input
                    id="validationDate"
                    type="date"
                    value={values.validationDate}
                    onChange={(e) =>
                      handleFieldChange("validationDate", e.target.value)
                    }
                    readOnly
                    className="q-field__input--readonly"
                  />
                  {errors.validationDate && (
                    <span className="q-field__error">
                      {errors.validationDate}
                    </span>
                  )}
                </div>
              </div>
            </section>
          </form>
          </div>

          <div className="q-preview create-quotation__preview-card">
          <div className="q-ticket">
            <div className="q-ticket__top">
              <span className="q-ticket__brand">BlechTek</span>
              <span className="q-ticket__type">Quotation</span>
            </div>

            <div className="q-ticket__body">
              <p className="q-ticket__label">Prepared for</p>
              <p className="q-ticket__value">
                {values.organizationName || "Customer"}
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
            </div>
          </div>

          {apiError && <div className="q-preview__error">{apiError}</div>}

          </div>
        </div>

        <div className="create-quotation__card create-quotation__scope-card">
          <form className="q-form" noValidate>
            <section className="q-form__section">
              <h3 className="q-form__heading">Scope & modules</h3>
              <p className="q-form__hint">
              </p>
              <ModuleSelector
                modules={modules}
                selected={values.selectedModules}
                onToggle={handleToggleModule}
                error={errors.selectedModules}
                disabled={readOnly}
              />
              {values.selectedModules.length > 0 && (
                <ModuleRequirements
                  selectedModules={values.selectedModules}
                  requirements={values.moduleRequirements || {}}
                  onChange={handleModuleRequirementChange}
                  disabled={readOnly}
                />
              )}
            </section>

            
          </form>
        </div>

        <div className="create-quotation__card create-quotation__additional-scope-card">
          <div className="additional-scope__header">
            <div>
              <h3 className="q-form__heading">Additional scope</h3>
              <p className="q-form__hint">
                Add any additional requirements outside the selected modules.
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                className="additional-scope__add-btn"
                onClick={handleAddAdditionalScope}
              >
                Add scope
              </button>
            )}
          </div>

          <div className="additional-scope__table-wrap">
            <table className="additional-scope__table">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Module</th>
                  <th>No. of Man Power</th>
                  <th>No. of Days</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  {!readOnly && <th aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {values.additionalScopes.length === 0 ? (
                  <tr>
                    <td
                      className="additional-scope__empty"
                      colSpan={readOnly ? 6 : 7}
                    >
                      No additional scope added.
                    </td>
                  </tr>
                ) : (
                  values.additionalScopes.map((scope, index) => (
                    <tr key={`additional-scope-${index}`}>
                      <td>
                        <textarea
                          rows="2"
                          value={scope.requirement}
                          onChange={(event) =>
                            handleAdditionalScopeChange(
                              index,
                              "requirement",
                              event.target.value,
                            )
                          }
                          disabled={readOnly}
                          placeholder="Description"
                        />
                      </td>
                      <td>
                        <select
                              value={scope.module}
                              onChange={(event) =>
                                handleAdditionalScopeChange(
                                  index,
                                  "module",
                                  event.target.value,
                                )
                              }
                              disabled={readOnly}
                            >
                              <option value="">Select module</option>

                              {values.selectedModules.map((moduleName) => (
                                <option key={moduleName} value={moduleName}>
                                  {moduleName}
                                </option>
                              ))}

                              <option value="Other">Other</option>
                            </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={scope.manPower}
                          onChange={(event) =>
                            handleAdditionalScopeChange(
                              index,
                              "manPower",
                              event.target.value,
                            )
                          }
                          disabled={readOnly}
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={scope.days}
                          onChange={(event) =>
                            handleAdditionalScopeChange(
                              index,
                              "days",
                              event.target.value,
                            )
                          }
                          disabled={readOnly}
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={scope.rate}
                          onChange={(event) =>
                            handleAdditionalScopeChange(
                              index,
                              "rate",
                              event.target.value,
                            )
                          }
                          disabled={readOnly}
                          placeholder="0.00"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={scope.amount}
                          readOnly
                          placeholder="0.00"
                        />
                      </td>
                      {!readOnly && (
                        <td>
                          <button
                            type="button"
                            className="additional-scope__remove-btn"
                            onClick={() => handleRemoveAdditionalScope(index)}
                            aria-label={`Remove additional scope ${index + 1}`}
                            title="Remove additional scope"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              aria-hidden="true"
                            >
                              <path d="M6 6l12 12M18 6 6 18" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog
          open={customerDialogOpen}
          onClose={() => setCustomerDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Customer</DialogTitle>
          <DialogContent>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                paddingTop: 8,
              }}
            >
              <TextField
                autoFocus
                required
                size="small"
                label="Name"
                value={newCustomer.name}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                label="State"
                value={newCustomer.state}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    state: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                label="State Code"
                value={newCustomer.stateCode}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    stateCode: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                label="GSTN"
                value={newCustomer.gstn}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    gstn: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                label="Contact Name"
                value={newCustomer.contactName}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    contactName: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                label="Contact Number"
                value={newCustomer.contactNumber}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    contactNumber: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                type="email"
                label="Email"
                value={newCustomer.email}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                multiline
                minRows={2}
                label="Address"
                value={newCustomer.address}
                onChange={(event) =>
                  setNewCustomer((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                sx={{ gridColumn: "1 / -1" }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomerDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateCustomer}
              disabled={!newCustomer.name.trim() || savingCustomer}
            >
              {savingCustomer ? "Adding..." : "Add customer"}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={referenceDialogOpen}
          onClose={() => setReferenceDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Add Reference</DialogTitle>
          <DialogContent>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                paddingTop: 8,
              }}
            >
              <TextField
                autoFocus
                required
                size="small"
                label="Name"
                value={newReference.name}
                onChange={(event) =>
                  setNewReference((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                type="email"
                label="Email"
                value={newReference.email}
                onChange={(event) =>
                  setNewReference((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                label="Phone"
                value={newReference.phone}
                onChange={(event) =>
                  setNewReference((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
              <TextField
                size="small"
                multiline
                minRows={2}
                label="Address"
                value={newReference.address}
                onChange={(event) =>
                  setNewReference((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                sx={{ gridColumn: "1 / -1" }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReferenceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateReference}
              disabled={!newReference.name.trim() || savingReference}
            >
              {savingReference ? "Adding..." : "Add reference"}
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
            >
              {sendingEmail ? "Sending…" : "Send"}
            </Button>
          </DialogActions>
        </Dialog>
        <CustomSnackbar
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          message={snackbar.message}
        />
      </div>
    </div>
  );
}

function ModuleSelector({ modules, selected, onToggle, error, disabled }) {
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
            <div className="module-selector__modules">
              {modules.map((module) => {
                const isSelected = selected.includes(module);
                return (
                  <label
                    key={module}
                    className={`module-selector__item ${
                      isSelected ? "module-selector__item--selected" : ""
                    }`}
                  >
                    <div className="module-selector__text">
                      <span className="module-selector__pillar-name">{pillar}</span>
                      <span className="module-selector__name">{module}</span>
                      
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(module)}
                      disabled={disabled}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuleRequirements({
  selectedModules,
  requirements,
  onChange,
  disabled,
}) {
  return (
    <div className="module-requirements">
      <h4 className="module-requirements__heading">
        Requirements for selected modules for the Implementation part.
      </h4>
      <p className="q-form__hint">
        Enter the quotation-specific requirements for each selected module.
      </p>
      <div className="module-requirements__list">
        {selectedModules.map((moduleName) => {
          const values = requirements[moduleName] || {};
          const unit = values.implementationEffortUnit || "";

          return (
            <div className="module-requirements__card" key={moduleName}>
              <h5 className="module-requirements__module">{moduleName}</h5>
              <div className="q-form__row">
                <div className="q-field">
                  <label htmlFor={`${moduleName}-users`}>No. of Users</label>
                  <input
                    id={`${moduleName}-users`}
                    type="number"
                    min="0"
                    step="1"
                    value={values.noOfUsers || ""}
                    onChange={(event) =>
                      onChange(moduleName, "noOfUsers", event.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="q-field">
                  <label htmlFor={`${moduleName}-installations`}>
                    No. of Installations
                  </label>
                  <input
                    id={`${moduleName}-installations`}
                    type="number"
                    min="0"
                    step="1"
                    value={values.noOfInstallations || ""}
                    onChange={(event) =>
                      onChange(
                        moduleName,
                        "noOfInstallations",
                        event.target.value,
                      )
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="q-field">
                  <label htmlFor={`${moduleName}-sites`}>No. of Sites</label>
                  <input
                    id={`${moduleName}-sites`}
                    type="number"
                    min="0"
                    step="1"
                    value={values.noOfSites || ""}
                    onChange={(event) =>
                      onChange(moduleName, "noOfSites", event.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="q-field">
                  <label htmlFor={`${moduleName}-unit`}>
                    Implementation Effort
                  </label>
                  <select
                    id={`${moduleName}-unit`}
                    value={unit}
                    onChange={(event) =>
                      onChange(
                        moduleName,
                        "implementationEffortUnit",
                        event.target.value,
                      )
                    }
                    disabled={disabled}
                  >
                    <option value="">Select effort</option>
                    <option value="1 Man Month">1 Man Month</option>
                    <option value="0.5 Man Month">0.5 Man Month</option>
                    <option value="2 Man Month">2 Man Month</option>
                    <option value="1 Day">1 Day</option>
                    <option value="2 Days">2 Days</option>
                    <option value="1 Week">1 Week</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
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

function getDaysBetween(start, end) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = endDate - startDate;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
}

function validate(values) {
  const errors = {};

  if (!values.organizationName.trim())
    errors.organizationName = "Customer is required.";
  if (!values.validationDate) errors.validationDate = "Pick a validity date.";
  if (!values.date) errors.date = "Date is required.";
  if (values.selectedModules.length === 0)
    errors.selectedModules = "Select at least one module.";
  return errors;
}
