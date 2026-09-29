import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import FileViewer from "../../components/FileViewer";
import {
  fetchPoVerification,
  updatePoClientDetails,
  approvePo,
  rejectPo,
  fetchPoAuditLog,
  reopenPo,
  fetchQuotationById,
} from "../../services/quotationApi";
import "./PoVerification.css";

const STATUS_CONFIG = {
  Draft: { label: "Draft", className: "pov-status-draft" },
  PendingReview: { label: "Pending Review", className: "pov-status-pending" },
  Approved: { label: "Approved", className: "pov-status-approved" },
  ApprovedWithMismatch: {
    label: "Approved with Mismatch",
    className: "pov-status-mismatch",
  },
  Rejected: { label: "Rejected", className: "pov-status-rejected" },
};

const COMPARISON_FIELDS = [
  {
    key: "amount",
    label: "Amount",
    quotationKey: "quotationAmount",
    clientKey: "clientPoAmount",
    type: "number",
  },
  {
    key: "items",
    label: "Items / Qty",
    quotationKey: "quotationItems",
    clientKey: "clientPoItems",
    type: "text",
  },
  {
    key: "terms",
    label: "Payment Terms",
    quotationKey: "quotationTerms",
    clientKey: "clientPoTerms",
    type: "text",
  },
];

const normalizeText = (text) => {
  if (!text) return "";
  return String(text).trim().toLowerCase().replace(/\s+/g, " ");
};

const compareValues = (quotationVal, clientVal, type) => {
  if (
    quotationVal === null ||
    quotationVal === undefined ||
    quotationVal === ""
  )
    return { match: false, reason: "Quotation value missing" };
  if (clientVal === null || clientVal === undefined || clientVal === "")
    return { match: false, reason: "Client value missing" };

  if (type === "number") {
    const q = Number(quotationVal);
    const c = Number(clientVal);
    return { match: Math.abs(q - c) < 0.01, q, c };
  }

  const qNorm = normalizeText(quotationVal);
  const cNorm = normalizeText(clientVal);
  return { match: qNorm === cNorm, q: qNorm, c: cNorm };
};

const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const formatQuotationItems = (items) => {
  if (!items) return "—";
  if (Array.isArray(items)) {
    return items
      .map((item) => {
        if (typeof item === "string") return item;
        const name =
          item.name ||
          item.moduleName ||
          item.module ||
          item.itemName ||
          "Item";
        const qty = item.qty || item.quantity || item.Qty || 1;
        return `${name} (Qty: ${qty})`;
      })
      .join("; ");
  }
  return String(items);
};

export default function PoVerificationScreen({ onNavigate }) {
  const rawId = sessionStorage.getItem("purchaseOrderId");
  const poId = Number(rawId);
  const isValidPoId = rawId !== null && rawId !== "" && !Number.isNaN(poId);
  const backView =
    sessionStorage.getItem("purchaseOrderBackView") ||
    "created-purchase-orders";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);

  const [clientDetails, setClientDetails] = useState({
    clientPoNumber: "",
    clientPoDate: "",
    clientPoAmount: "",
    clientPoItems: "",
    clientPoTerms: "",
  });

  const [quotationDisplay, setQuotationDisplay] = useState({
    refNo: "",
    refDate: "",
    amount: "",
    items: "",
    terms: "",
  });

  const [comparisonResults, setComparisonResults] = useState({});

  const getQuotationField = (key) => {
    if (!data) return "";
    const fieldMap = {
      quotationAmount:
        quotationDisplay.amount ||
        data.quotationAmount ||
        data.amount ||
        data.totalAmount,
      quotationItems:
        quotationDisplay.items ||
        data.quotationItems ||
        data.items ||
        data.moduleDetails ||
        data.modules,
      quotationTerms:
        quotationDisplay.terms ||
        data.quotationTerms ||
        data.terms ||
        data.paymentTerms,
      quotationRefNo:
        quotationDisplay.refNo ||
        data.quotationRefNo ||
        data.quotationNo ||
        data.quotationNumber,
      quotationRefDate:
        quotationDisplay.refDate ||
        data.quotationRefDate ||
        data.quotationDate ||
        data.date,
    };
    return fieldMap[key] || data[key] || "";
  };

  const loadData = useCallback(async () => {
    if (!isValidPoId) {
      setError(
        `No purchase order was selected to verify (sessionStorage "purchaseOrderId" was "${rawId}"). Please go back and click "Verify PO" again.`,
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 15000);
    });

    try {
      const [verification, logs] = await Promise.all([
        Promise.race([fetchPoVerification(poId), timeoutPromise]),
        Promise.race([fetchPoAuditLog(poId), timeoutPromise]),
      ]);
      setData(verification);
      setAuditLogs(logs);

      // Debug: log all verification fields
      console.log("Verification API response:", verification);

      // Helper to get value from multiple possible field names
      const getField = (obj, ...keys) => {
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
            return obj[key];
          }
        }
        return "";
      };

      setClientDetails({
        clientPoNumber: getField(
          verification,
          "clientPoNumber",
          "clientPONumber",
        ),
        clientPoDate: getField(verification, "clientPoDate", "clientPODate")
          ? new Date(getField(verification, "clientPoDate", "clientPODate"))
              .toISOString()
              .slice(0, 10)
          : "",
        clientPoAmount:
          getField(
            verification,
            "clientPoAmount",
            "clientPOAmount",
          )?.toString() || "",
        clientPoItems: getField(
          verification,
          "clientPoItems",
          "clientPOItems",
          "clientPoItemsText",
        ),
        clientPoTerms: getField(verification, "clientPoTerms", "clientPOTerms"),
      });

      // Store quotation fields for display
      setQuotationDisplay({
        refNo: getField(
          verification,
          "quotationRefNo",
          "quotationNo",
          "quotationNumber",
        ),
        refDate: getField(
          verification,
          "quotationRefDate",
          "quotationDate",
          "date",
        ),
        amount: getField(
          verification,
          "quotationAmount",
          "amount",
          "totalAmount",
        ),
        items: getField(
          verification,
          "quotationItems",
          "items",
          "moduleDetails",
          "modules",
        ),
        terms: getField(
          verification,
          "quotationTerms",
          "terms",
          "paymentTerms",
        ),
      });

      // If items are missing, fetch full quotation details using quotationRefNo
      const quotationRef = getField(
        verification,
        "quotationRefNo",
        "quotationNo",
        "quotationNumber",
      );
      if (quotationRef && !getField(verification, "quotationItems", "items", "moduleDetails", "modules")) {
        try {
          const quotation = await fetchQuotationById(quotationRef);
          if (quotation) {
            console.log("Fetched full quotation:", quotation);
            setQuotationDisplay((prev) => ({
              ...prev,
              items: quotation.moduleDetails || quotation.modules || quotation.items || "",
              refDate: prev.refDate || quotation.date || quotation.quotationDate,
              terms: prev.terms || quotation.terms || quotation.paymentTerms,
            }));
          }
        } catch (quotationErr) {
          console.warn("Failed to fetch quotation details:", quotationErr);
        }
      }

      setVerificationConfirmed(false);
      setShowApproveDialog(false);
      computeComparison(verification);
    } catch (err) {
      console.error("Failed to load PO verification:", err);
      setError(
        err.response?.status === 404
          ? `Purchase order ${poId} was not found.`
          : "Failed to load purchase order verification data.",
      );
    } finally {
      setLoading(false);
    }
  }, [isValidPoId, poId, rawId]);

  const computeComparison = (verification) => {
    const results = {};
    COMPARISON_FIELDS.forEach((field) => {
      results[field.key] = {
        ...compareValues(
          verification[field.quotationKey],
          verification[field.clientKey],
          field.type,
        ),
        field,
      };
    });
    setComparisonResults(results);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!data) return;
    const results = {};
    COMPARISON_FIELDS.forEach((field) => {
      const clientVal =
        field.key === "amount"
          ? clientDetails.clientPoAmount
          : field.key === "items"
            ? clientDetails.clientPoItems
            : clientDetails.clientPoTerms;
      results[field.key] = {
        ...compareValues(data[field.quotationKey], clientVal, field.type),
        field,
      };
    });
    setComparisonResults(results);
  }, [clientDetails, data]);

  const handleClientDetailChange = (field, value) => {
    setClientDetails((prev) => ({ ...prev, [field]: value }));
  };

  const buildClientPayload = () => ({
    ClientPoNumber: clientDetails.clientPoNumber,
    ClientPoDate: clientDetails.clientPoDate,
    ClientPoAmount: clientDetails.clientPoAmount
      ? Number(clientDetails.clientPoAmount)
      : null,
    ClientPoItems: clientDetails.clientPoItems,
    ClientPoTerms: clientDetails.clientPoTerms,
  });

  const handleSaveDraft = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await updatePoClientDetails(poId, buildClientPayload());
      await loadData();
    } catch (err) {
      setError("Failed to save draft. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!data) return;
    try {
      await updatePoClientDetails(poId, buildClientPayload());
    } catch (err) {
      setError("Failed to save client details before approval.");
      return;
    }
    setApproving(true);
    try {
      await approvePo(poId, { Notes: approvalNotes });
      await loadData();
      setApprovalNotes("");
      setVerificationConfirmed(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve.");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    setRejecting(true);
    try {
      await rejectPo(poId, { Notes: rejectionNotes });
      await loadData();
      setRejectionNotes("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject.");
    } finally {
      setRejecting(false);
    }
  };

  const handleReopen = async () => {
    if (!data) return;
    setReopening(true);
    try {
      await reopenPo(poId, { Reason: reopenReason });
      await loadData();
      setReopenReason("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reopen.");
    } finally {
      setReopening(false);
      setShowReopenDialog(false);
    }
  };

  const handleOpenApproveDialog = () => {
    if (!verificationConfirmed) {
      setError(
        "Please confirm you have checked the uploaded client PO against these values.",
      );
      return;
    }
    if (mismatchCount > 0 && !approvalNotes.trim()) {
      setError("Notes are required when there are mismatches.");
      return;
    }
    setShowApproveDialog(true);
  };

  const handleConfirmApprove = async () => {
    setShowApproveDialog(false);
    await handleApprove();
  };

  const handleConfirmReopen = async () => {
    if (!reopenReason.trim()) {
      setError("Reason is required to reopen the purchase order.");
      return;
    }
    setShowReopenDialog(false);
    await handleReopen();
  };

  const mismatchCount = Object.values(comparisonResults).filter(
    (r) => !r.match,
  ).length;

  const normalizeStatus = (status) => {
    if (!status) return "Draft";
    return status.replace(/\s+/g, "");
  };

  const normalizedStatus = normalizeStatus(data?.verificationStatus);
  const statusConfig = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.Draft;

  // Debug: log status for debugging
  console.log(
    "PO Verification Status:",
    data?.verificationStatus,
    "Normalized:",
    normalizedStatus,
  );

  const isFinalStatus =
    data &&
    [
      "Approved",
      "ApprovedWithMismatch",
      "Rejected",
      "ApprovedWithMismatch",
      "Cancelled",
      "Closed",
      "Completed",
    ].some((s) => normalizeStatus(s) === normalizedStatus);

  const canEditClientDetails =
    data &&
    !isFinalStatus &&
    (normalizedStatus === "Draft" ||
      normalizedStatus === "PendingReview" ||
      normalizedStatus === "Pending" ||
      normalizedStatus === "UnderReview" ||
      normalizedStatus === "Submitted");

  // Debug: log all relevant values
  console.log("Debug - data:", data);
  console.log("Debug - verificationStatus:", data?.verificationStatus);
  console.log("Debug - normalizedStatus:", normalizedStatus);
  console.log("Debug - isFinalStatus:", isFinalStatus);
  console.log("Debug - canEditClientDetails:", canEditClientDetails);

  if (loading) {
    return (
      <div className="pov-loading">
        <div className="pov-spinner" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="pov-error">
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
        <button
          className="pov-common-back-btn"
          onClick={() => onNavigate(backView)}
          aria-label="Back"
        >
          <ArrowBackIcon fontSize="small" />
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="pov-page">
      <header className="pov-header">
        <h1>PO Verification: {data.poNo}</h1>
        <span className="pov-sub">
          Quotation {data.quotationRefNo || "—"}
          {data.buyerName ? ` · ${data.buyerName}` : ""}
        </span>
        <span className={`pov-badge ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
        <button
          className="pov-common-back-btn"
          onClick={() => onNavigate(backView)}
          aria-label="Back"
          title="Back"
        >
          <ArrowBackIcon fontSize="small" />
        </button>
      </header>

      {error && (
        <div className="pov-error" style={{ margin: "16px 20px" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="pov-layout">
        {/* LEFT: file viewer */}
        <div className="pov-viewer">
          <Paper elevation={0} className="pov-viewer-inner">
            <FileViewer
              poId={poId}
              fileName={data.uploadedFileName}
              contentType={data.fileContentType}
            />
          </Paper>
        </div>

        {/* RIGHT: cards */}
        <div className="pov-col">
          {/* Card 1: Quotation Details */}
          <div className="pov-card">
            <h2>
              <DescriptionIcon fontSize="small" /> Quotation details
            </h2>
            <div className="pov-hint">Loaded automatically. Read-only.</div>
            <div className="pov-row">
              <label>Quotation No.</label>
              <div className="pov-ro">
                {quotationDisplay.refNo || data.quotationRefNo || "—"}
              </div>
            </div>
            <div className="pov-row">
              <label>Quotation Date</label>
              <div className="pov-ro">
                {quotationDisplay.refDate
                  ? new Date(quotationDisplay.refDate).toLocaleDateString()
                  : "—"}
              </div>
            </div>
            <div className="pov-row">
              <label>Amount</label>
              <div className="pov-ro pov-ro-amount">
                {money(quotationDisplay.amount || data.quotationAmount)}
              </div>
            </div>
            <div className="pov-row">
              <label>Items / Qty</label>
              <div className="pov-ro">
                {formatQuotationItems(quotationDisplay.items || data.quotationItems || data.items)}
              </div>
            </div>
            <div className="pov-row">
              <label>Payment terms</label>
              <div className="pov-ro">
                {quotationDisplay.terms ||
                  data.quotationTerms ||
                  data.paymentTerms ||
                  "—"}
              </div>
            </div>
          </div>

          {/* Card 2: Client PO Details */}
          <div className="pov-card">
            <h2>
              Client PO details
              {canEditClientDetails && !isFinalStatus && (
                <span className="pov-tag pov-tag-editable">Editable</span>
              )}
              {isFinalStatus && (
                <span className="pov-tag pov-tag-readonly">Read-only</span>
              )}
            </h2>
            <div className="pov-hint">
              Type what the uploaded document says.
            </div>

            <div className="pov-row">
              <label>Client PO No.</label>
              <div className="pov-input-wrap">
                <input
                  value={clientDetails.clientPoNumber}
                  onChange={(e) =>
                    handleClientDetailChange("clientPoNumber", e.target.value)
                  }
                  // disabled={!canEditClientDetails || isFinalStatus}
                />
                <MatchIcon result={comparisonResults.clientPoNumber} />
              </div>
            </div>

            <div className="pov-row">
              <label>Client PO Date</label>
              <input
                type="date"
                value={clientDetails.clientPoDate}
                onChange={(e) =>
                  handleClientDetailChange("clientPoDate", e.target.value)
                }
                // disabled={!canEditClientDetails || isFinalStatus}
              />
            </div>

            <div className="pov-row">
              <label>Amount (₹)</label>
              <div className="pov-input-wrap">
                <input
                  type="number"
                  step="0.01"
                  value={clientDetails.clientPoAmount}
                  onChange={(e) =>
                    handleClientDetailChange("clientPoAmount", e.target.value)
                  }
                  // disabled={!canEditClientDetails || isFinalStatus}
                />
                <MatchIcon result={comparisonResults.amount} />
              </div>
            </div>

            <div className="pov-row pov-row-textarea">
              <label>Items / Qty</label>
              <div className="pov-input-wrap">
                <textarea
                  rows={3}
                  value={clientDetails.clientPoItems}
                  onChange={(e) =>
                    handleClientDetailChange("clientPoItems", e.target.value)
                  }
                  // disabled={!canEditClientDetails || isFinalStatus}
                />
                <MatchIcon result={comparisonResults.items} />
              </div>
            </div>

            <div className="pov-row pov-row-textarea">
              <label>Payment terms</label>
              <div className="pov-input-wrap">
                <textarea
                  rows={3}
                  value={clientDetails.clientPoTerms}
                  onChange={(e) =>
                    handleClientDetailChange("clientPoTerms", e.target.value)
                  }
                  // disabled={!canEditClientDetails || isFinalStatus}
                />
                <MatchIcon result={comparisonResults.terms} />
              </div>
            </div>

            {canEditClientDetails && !isFinalStatus && (
              <div className="pov-actions">
                <button onClick={handleSaveDraft} disabled={saving}>
                  {saving ? "Saving..." : "Save draft"}
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Comparison */}
          <div className="pov-card">
            <h2>
              <VisibilityIcon fontSize="small" /> Comparison
            </h2>
            <div className="pov-hint">Updates as you type.</div>
            <table className="pov-cmp">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Quotation</th>
                  <th>Client PO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FIELDS.map((field) => {
                  const result = comparisonResults[field.key];
                  const qVal =
                    field.type === "number"
                      ? money(getQuotationField(field.quotationKey))
                      : getQuotationField(field.quotationKey) || "—";
                  const cVal =
                    field.type === "number"
                      ? money(clientDetails[field.clientKey])
                      : clientDetails[field.clientKey] || "—";
                  return (
                    <tr key={field.key}>
                      <td>{field.label}</td>
                      <td>{qVal}</td>
                      <td>{cVal}</td>
                      <td className={result?.match ? "pov-ok" : "pov-bad"}>
                        {result?.match === undefined
                          ? "—"
                          : result.match
                            ? "✓ Match"
                            : "⚠ Differs"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div
              className={`pov-sum ${mismatchCount ? "pov-diff" : "pov-good"}`}
            >
              {mismatchCount ? (
                <>
                  <WarningIcon fontSize="small" />
                  {mismatchCount} field{mismatchCount !== 1 ? "s" : ""} differ.
                  The approver will need to add a note.
                </>
              ) : (
                <>
                  <CheckCircleIcon fontSize="small" />
                  All fields match the quotation.
                </>
              )}
            </div>
          </div>

          {/* Actions for Draft / PendingReview */}
          {canEditClientDetails && !isFinalStatus && (
            <div className="pov-card">
              <h2>Actions</h2>
              <Alert severity="info" sx={{ mb: 2 }}>
                Verify the comparison above, add notes if there are mismatches,
                then Approve or Reject.
              </Alert>

              <label className="pov-checkbox-label">
                <input
                  type="checkbox"
                  checked={verificationConfirmed}
                  onChange={(e) => setVerificationConfirmed(e.target.checked)}
                  disabled={approving || rejecting}
                />
                I have checked the uploaded client PO against these values
              </label>

              <div className="pov-notes-field">
                <label>Notes (required for mismatch)</label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Enter your review notes..."
                />
              </div>

              <div className="pov-actions">
                <button
                  className="pov-primary"
                  onClick={handleOpenApproveDialog}
                  disabled={
                    approving ||
                    !verificationConfirmed ||
                    (mismatchCount > 0 && !approvalNotes.trim())
                  }
                >
                  {approving ? "Approving..." : "Approve"}
                </button>
                <button
                  className="pov-danger"
                  onClick={handleReject}
                  disabled={rejecting || !rejectionNotes.trim()}
                >
                  {rejecting ? "Rejecting..." : "Reject"}
                </button>
              </div>
              <div className="pov-notes-field" style={{ marginTop: 12 }}>
                <label>Rejection notes</label>
                <textarea
                  rows={2}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Required to reject..."
                />
              </div>
            </div>
          )}

          {/* Final status + reopen */}
          {isFinalStatus && (
            <div className="pov-card">
              <h2>Verification complete</h2>
              <div className="pov-final-row">
                <span className="pov-final-label">Verified by</span>
                <span className="pov-final-value">
                  {data.verifiedByName || "—"}
                  {data.verifiedBy && (
                    <Chip
                      label={`ID: ${data.verifiedBy}`}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </span>
              </div>
              <div className="pov-final-row">
                <span className="pov-final-label">Verified at</span>
                <span className="pov-final-value">
                  {data.verifiedAt
                    ? new Date(data.verifiedAt).toLocaleString()
                    : "—"}
                </span>
              </div>
              {data.verificationNotes && (
                <div className="pov-final-notes">{data.verificationNotes}</div>
              )}
              <div className="pov-actions" style={{ marginTop: 12 }}>
                <button
                  onClick={() => setShowReopenDialog(true)}
                  disabled={reopening}
                >
                  <RefreshIcon
                    fontSize="small"
                    style={{ verticalAlign: "middle", marginRight: 4 }}
                  />
                  {reopening ? "Reopening..." : "Reopen PO"}
                </button>
              </div>
            </div>
          )}

          {/* Audit log */}
          <button
            className="pov-audit-toggle"
            onClick={() => setShowAuditLog(!showAuditLog)}
          >
            {showAuditLog ? "Hide" : "Show"} audit log ({auditLogs.length})
          </button>
          {showAuditLog && auditLogs.length > 0 && (
            <div className="pov-audit-log">
              <table className="pov-audit-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>By</th>
                    <th>At</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.Id}>
                      <td>
                        <span className="pov-audit-action">{log.Action}</span>
                      </td>
                      <td>{log.ChangedByName || `User ${log.ChangedBy}`}</td>
                      <td>{new Date(log.ChangedAt).toLocaleString()}</td>
                      <td>{log.Notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          className="pov-dialog-title"
          sx={{ background: "linear-gradient(120deg,#2b5797,#48a0e4)" }}
        >
          Confirm Approval
        </DialogTitle>
        <DialogContent className="pov-dialog-content">
          <p>
            <strong>PO No: {data?.poNo}</strong>
          </p>
          <p>
            Status will be set to:{" "}
            <strong>
              {mismatchCount > 0 ? "ApprovedWithMismatch" : "Approved"}
            </strong>
          </p>
          {mismatchCount > 0 ? (
            <div className="pov-sum pov-diff" style={{ display: "block" }}>
              <strong>The following fields differ:</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {COMPARISON_FIELDS.map((field) => {
                  const result = comparisonResults[field.key];
                  return result && !result.match ? (
                    <li key={field.key}>{field.label}</li>
                  ) : null;
                })}
              </ul>
            </div>
          ) : (
            <div className="pov-sum pov-good">
              All fields match. PO will be Approved.
            </div>
          )}
        </DialogContent>
        <DialogActions className="pov-dialog-actions">
          <Button
            onClick={() => setShowApproveDialog(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            color="success"
            disabled={approving}
          >
            {approving ? "Approving..." : "Confirm Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reopen Dialog */}
      <Dialog
        open={showReopenDialog}
        onClose={() => setShowReopenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          className="pov-dialog-title"
          sx={{ background: "linear-gradient(120deg,#b3690a,#e0a24a)" }}
        >
          Reopen Purchase Order
        </DialogTitle>
        <DialogContent className="pov-dialog-content">
          <p>
            <strong>PO No: {data?.poNo}</strong>
          </p>
          <p>Current status: {data?.verificationStatus}</p>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for reopening (required)"
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions className="pov-dialog-actions">
          <Button onClick={() => setShowReopenDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReopen}
            variant="contained"
            color="warning"
            disabled={reopening || !reopenReason.trim()}
          >
            {reopening ? "Reopening..." : "Confirm Reopen"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function MatchIcon({ result }) {
  if (!result || result.match === undefined) return null;
  return result.match ? (
    <CheckCircleIcon fontSize="small" className="pov-icon-ok" />
  ) : (
    <WarningIcon fontSize="small" className="pov-icon-warn" />
  );
}
