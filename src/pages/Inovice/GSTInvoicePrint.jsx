import React, { useEffect, useMemo, useState } from "react";
import "./GSTInvoice.css";
import { fetchInvoiceById } from "../../services/quotationApi";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const emptyInvoice = {
  // originalFor: "ORIGINAL FOR RECIPIENT",
  companyName: "Your Company Name",
  invoiceNo: "",
  dateOfIssue: "",
  timeOfIssue: "",
  placeOfService: "",
  supplierName: "",
  supplierAddress: "",
  supplierState: "",
  supplierStateCode: "",
  supplierGSTN: "",
  bankName: "",
  accountNo: "",
  accountType: "Current",
  ifsc: "",
  msmeNo: "",
  receiverName: "",
  receiverAddress: "",
  receiverState: "",
  receiverStateCode: "",
  receiverGSTN: "",
  consigneeName: "",
  consigneeAddress: "",
  consigneeState: "",
  consigneeStateCode: "",
  consigneeGSTN: "",
  poNoDate: "",
  hsnCode: "",
  sacCode: "",
  reverseCharge: "No",
  amountInWords: "",
  termsOfSale: "",
  sgstPct: 0,
  cgstPct: 0,
  igstPct: 0,
  tdsPct: 0,
  insurance: 0,
};

function normalizePrintData(source) {
  if (!source) {
    return null;
  }

  const normalized = source.invoice
    ? source
    : { invoice: source, items: source.items || [] };

  return {
    ...normalized,
    invoice: { ...emptyInvoice, ...(normalized.invoice || {}) },
    items: Array.isArray(normalized.items) ? normalized.items : [],
    additionalScopes: Array.isArray(normalized.additionalScopes)
      ? normalized.additionalScopes
      : [],
  };
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function currency(n) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getLineAmount(row) {
  // Invoice rate already includes any PO/quotation discount.
  return (Number(row.qty) || 0) * (Number(row.rate) || 0);
}

export default function GSTInvoicePrint({ initialData, onBack }) {
  const initialPrintData = normalizePrintData(initialData);
  const [invoice, setInvoice] = useState(
    initialPrintData?.invoice || { ...emptyInvoice },
  );
  const [items, setItems] = useState(
    initialPrintData?.items?.length
      ? initialPrintData.items.map((row, index) => ({
          ...row,
          id: row.id ?? index + 1,
        }))
      : [],
  );
  const [additionalScopes, setAdditionalScopes] = useState(
    initialPrintData?.additionalScopes || [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = sessionStorage.getItem("invoicePrintData");
        const preferred = stored ? JSON.parse(stored) : null;
        const source = preferred || initialData;

        if (source) {
          const normalized = normalizePrintData(source);
          setInvoice(normalized.invoice);
          setItems(
            normalized.items?.length
              ? normalized.items.map((row, index) => ({
                  ...row,
                  id: row.id ?? index + 1,
                }))
              : [],
          );
          setAdditionalScopes(normalized.additionalScopes || []);
          setLoading(false);
          return;
        }

        const printId = sessionStorage.getItem("invoicePrintId");
        if (printId) {
          const remote = await fetchInvoiceById(Number(printId));
          const normalized = normalizePrintData(remote);
          setInvoice(normalized?.invoice || { ...emptyInvoice });
          setItems(
            (normalized?.items || []).map((row, index) => ({
              ...row,
              id: row.id ?? index + 1,
            })),
          );
          setAdditionalScopes(normalized?.additionalScopes || []);
        }
      } catch (error) {
        console.error("Failed to load invoice print data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [initialData]);

  const totals = useMemo(() => {
    const totalQty = items.reduce(
      (sum, row) => sum + (Number(row.qty) || 0),
      0,
    );
    const lineItemsTotal = items.reduce(
      (sum, row) => sum + getLineAmount(row),
      0,
    );
    const additionalScopeTotal = additionalScopes.reduce(
      (sum, scope) => sum + (Number(scope.amount ?? scope.Amount) || 0),
      0,
    );
    const totalPrice = lineItemsTotal + additionalScopeTotal;
    const sgst = (totalPrice * (Number(invoice.sgstPct) || 0)) / 100;
    const cgst = (totalPrice * (Number(invoice.cgstPct) || 0)) / 100;
    const igst = (totalPrice * (Number(invoice.igstPct) || 0)) / 100;
    const subtotal = totalPrice + sgst + cgst + igst;
    const tds = (subtotal * (Number(invoice.tdsPct) || 0)) / 100;
    const insurance = Number(invoice.insurance) || 0;
    const grandTotal = subtotal - tds + insurance;

    return {
      totalQty,
      totalPrice,
      sgst,
      cgst,
      igst,
      subtotal,
      tds,
      insurance,
      grandTotal,
    };
  }, [
    items,
    additionalScopes,
    invoice.sgstPct,
    invoice.cgstPct,
    invoice.igstPct,
    invoice.tdsPct,
    invoice.insurance,
  ]);

  if (loading) {
    return (
      <div className="gi-page">
        <div className="gi-sheet">
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gi-page">
      <div className="gi-toolbar no-print">
        <div className="gi-toolbar-spacer" />
        <button
          type="button"
          className="gi-btn gi-btn-primary"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
        {onBack && (
          <button
            type="button"
            className="gi-btn gi-btn-secondary gi-btn-back"
            onClick={onBack}
            aria-label="Back to invoice entry"
            title="Back"
          >
            <ArrowBackIcon fontSize="small" />
          </button>
        )}
      </div>

      <div className="gi-sheet">
        <div className="gi-header">
          <div className="gi-logo">
            <img
              src="/logo/logo.png"
              alt="BlechTek Software Solutions LLP logo"
            />
          </div>
          <div className="gi-company-name">BlechTek Software Solutions LLP</div>
          {/* <div className="gi-original-tag">{invoice.originalFor || "ORIGINAL FOR RECIPIENT"}</div> */}
        </div>

        <div className="gi-row gi-meta">
          <div className="gi-cell">
            <span className="gi-label">Invoice No.:</span>
            <span>{invoice.invoiceNo || "-"}</span>
          </div>
          <div className="gi-cell">
            <span className="gi-label">Time of Issue of Invoice:</span>
            <span>{invoice.timeOfIssue || "-"}</span>
          </div>
        </div>
        <div className="gi-row gi-meta">
          <div className="gi-cell">
            <span className="gi-label">Date of Issue of Invoice:</span>
            <span>{formatDate(invoice.dateOfIssue)}</span>
          </div>
          <div className="gi-cell">
            <span className="gi-label">Place of Service:</span>
            <span>{invoice.placeOfService || "-"}</span>
          </div>
        </div>

        <div className="gi-grid-2">
          <div className="gi-block">
            <div className="gi-field">
              <span className="gi-label">Name:</span>
              <span>{invoice.supplierName || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">Address:</span>
              <span>{invoice.supplierAddress || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">State:</span>
              <span>{invoice.supplierState || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">State Code:</span>
              <span>{invoice.supplierStateCode || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">GSTN No.:</span>
              <span>{invoice.supplierGSTN || "-"}</span>
            </div>
          </div>

          <div className="gi-block">
            <div className="gi-field">
              <span className="gi-label">Bank Name:</span>
              <span>{invoice.bankName || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">Account No.:</span>
              <span>{invoice.accountNo || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">Account Type:</span>
              <span>{invoice.accountType || "Current"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">IFSC:</span>
              <span>{invoice.ifsc || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">MSME No.:</span>
              <span>{invoice.msmeNo || "-"}</span>
            </div>
          </div>
        </div>

        <div className="gi-grid-2">
          <div className="gi-block">
            <div className="gi-block-title">Billed To</div>
            <div className="gi-field">
              <span className="gi-label">Name:</span>
              <span>{invoice.receiverName || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">Address:</span>
              <span>{invoice.receiverAddress || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">State:</span>
              <span>{invoice.receiverState || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">State Code:</span>
              <span>{invoice.receiverStateCode || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">GSTN No.:</span>
              <span>{invoice.receiverGSTN || "-"}</span>
            </div>
          </div>

          <div className="gi-block">
            <div className="gi-block-title">Shipped To</div>
            <div className="gi-field">
              <span className="gi-label">Name:</span>
              <span>{invoice.consigneeName || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">Address:</span>
              <span>{invoice.consigneeAddress || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">State:</span>
              <span>{invoice.consigneeState || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">State Code:</span>
              <span>{invoice.consigneeStateCode || "-"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">GSTN No.:</span>
              <span>{invoice.consigneeGSTN || "-"}</span>
            </div>
          </div>
        </div>

        <div className="gi-row gi-meta">
          <div className="gi-cell">
            <span className="gi-label">PO No. / Date:</span>
            <span>{invoice.poNoDate || "-"}</span>
          </div>
          <div className="gi-cell">
            <span className="gi-label">HSN Code:</span>
            <span>{invoice.hsnCode || "-"}</span>
          </div>
          <div className="gi-cell">
            <span className="gi-label">SAC Code:</span>
            <span>{invoice.sacCode || "-"}</span>
          </div>
        </div>

        <table className="gi-table">
          <thead>
            <tr>
              <th className="gi-col-sl">Sl. No.</th>
              <th>Description</th>
              <th className="gi-col-qty">Qty</th>
              <th className="gi-col-uom">UOM</th>
              <th className="gi-col-total">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((row, index) => (
                <tr key={row.id ?? `${row.description}-${index}`}>
                  <td className="gi-col-sl">{index + 1}</td>
                  <td>{row.description || "-"}</td>
                  <td className="gi-col-qty">{Number(row.qty) || 0}</td>
                  <td className="gi-col-uom">{row.uom || "Nos."}</td>
                  <td className="gi-col-total">
                    ₹ {currency(getLineAmount(row))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="gi-empty-row">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {additionalScopes.length > 0 && (
          <table className="gi-table gi-scope-table">
            <thead>
              <tr>
                <th>Additional Scope / Requirement</th>
                <th>Module</th>
                <th>Manpower</th>
                <th>Days</th>
                <th>Rate (₹)</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {additionalScopes.map((scope, index) => (
                <tr key={`scope-${index}`}>
                  <td>{scope.requirement ?? scope.Requirement ?? "-"}</td>
                  <td>{scope.modules ?? scope.Modules ?? "-"}</td>
                  <td>{scope.noOfManpower ?? scope.NoOfManpower ?? 0}</td>
                  <td>{scope.noOfDays ?? scope.NoOfDays ?? 0}</td>
                  <td className="gi-num">
                    {currency(Number(scope.rate ?? scope.Rate) || 0)}
                  </td>
                  <td className="gi-num">
                    {currency(Number(scope.amount ?? scope.Amount) || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="gi-footer-grid">
          <div className="gi-footer-block">
            <p className="gi-declaration">
              Certified that the particulars given above are true and correct
              and the amount indicated represents the price actually charged and
              that there is no flow of additional consideration directly or
              indirectly from the buyer.
            </p>
            <div className="gi-field">
              <span className="gi-label">
                Tax Payable on Reverse Charge (Yes/No):
              </span>
              <span>{invoice.reverseCharge || "No"}</span>
            </div>
            <div className="gi-field">
              <span className="gi-label">Amount in Words:</span>
              <span>{invoice.amountInWords || "-"}</span>
            </div>
            <p className="gi-declaration gi-return-note">
              I/We hereby certify that my/our registration certificate under the
              GST Act, 2017 is in force on the date on which the sale of the
              goods specified in the tax invoice is made by me/us and that the
              transaction of sale covered by this tax invoice has been effected
              by me/us and it shall be accounted for in the turnover of sales
              while filing of return and the due tax, if any payable on this
              sale has been paid or shall be paid.
            </p>
          </div>
          <div className="gi-footer-block">
            <div className="gi-totals">
              <div className="gi-totals-row">
                <span className="gi-label">Total Price:</span>
                <span>₹ {currency(totals.totalPrice)}</span>
              </div>
              <div className="gi-totals-row">
                <span className="gi-label">SGST:</span>
                <span>₹ {currency(totals.sgst)}</span>
              </div>
              <div className="gi-totals-row">
                <span className="gi-label">CGST:</span>
                <span>₹ {currency(totals.cgst)}</span>
              </div>
              <div className="gi-totals-row">
                <span className="gi-label">IGST:</span>
                <span>₹ {currency(totals.igst)}</span>
              </div>
              <div className="gi-totals-row">
                <span className="gi-label">Subtotal:</span>
                <span>₹ {currency(totals.subtotal)}</span>
              </div>
              <div className="gi-totals-row">
                <span className="gi-label">TDS:</span>
                <span>-₹ {currency(totals.tds)}</span>
              </div>
              <div className="gi-totals-row">
                <span className="gi-label">Insurance:</span>
                <span>₹ {currency(totals.insurance)}</span>
              </div>
              <div className="gi-totals-row gi-grand-total">
                <span className="gi-label">Grand Total:</span>
                <strong>₹ {currency(totals.grandTotal)}</strong>
              </div>
            </div>
            <div className="gi-field">
              <span className="gi-label">Terms of Sale:</span>
              <span>{invoice.termsOfSale || "-"}</span>
            </div>
          </div>
          <div className="gi-signatory">
            <div className="gi-signatory-line">
              For BlechTek Software Solutions LLP
            </div>
            <div
              className="gi-signatory-space"
              aria-label="Space reserved for company seal"
            />
            <div className="gi-signatory-line gi-signatory-caption">
              Authorised Signatory
            </div>
          </div>
          <div className="gi-system-generated">
            This is a System Generated Invoice. Authorised signature and seal
            may be affixed above.
          </div>
        </div>
      </div>
    </div>
  );
}
