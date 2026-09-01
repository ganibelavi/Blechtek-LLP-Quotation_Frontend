import React, { useState, useMemo } from "react";
import "./PurchaseOrder.css";

/**
 * Purchase Order — editable, printable PO page.
 * Mirrors the layout/style of the GSTInvoice component:
 * buyer/supplier details, a reference line back to the source
 * quotation, an editable item table, delivery/payment terms,
 * a status badge, and a "Convert to Invoice" action.
 *
 * Usage: <PurchaseOrder initialData={...} onConvertToInvoice={fn} />
 * - initialData: optional object to pre-fill the form (e.g. copied
 *   over from an accepted quotation). Shape matches `emptyPO` below.
 * - onConvertToInvoice(poData): called when the user clicks
 *   "Convert to Invoice" — wire this to your API call / route push.
 */

let rowId = 1;
const newRow = () => ({
  id: rowId++,
  description: "",
  qty: 1,
  uom: "Nos.",
  rate: 0,
});

const emptyPO = {
  companyName: "Your Company Name",
  poNo: "",
  poDate: "",
  status: "open", // open | partially_fulfilled | fulfilled | cancelled

  quotationRefNo: "",
  quotationRefDate: "",

  buyerName: "",
  buyerAddress: "",
  buyerState: "",
  buyerStateCode: "",
  buyerGSTN: "",

  supplierName: "",
  supplierAddress: "",
  supplierState: "",
  supplierStateCode: "",
  supplierGSTN: "",

  deliveryTerms: "",
  paymentTerms: "",
  expectedDeliveryDate: "",
  notes: "",
};

const STATUS_LABEL = {
  open: "Open",
  partially_fulfilled: "Partially fulfilled",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

function currency(n) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PurchaseOrder({ initialData, onConvertToInvoice, onBackToQuotation }) {
  const [po, setPo] = useState({ ...emptyPO, ...(initialData?.po || {}) });
  const [items, setItems] = useState(
    initialData?.items?.length
      ? initialData.items.map((r) => ({ ...r, id: rowId++ }))
      : [newRow()]
  );

  const field = (key) => ({
    value: po[key],
    onChange: (e) => setPo((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const updateItem = (id, key, value) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const addRow = () => setItems((prev) => [...prev, newRow()]);
  const removeRow = (id) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const totals = useMemo(() => {
    const totalQty = items.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const totalPrice = items.reduce(
      (s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0),
      0
    );
    return { totalQty, totalPrice };
  }, [items]);

  const handlePrint = () => window.print();

  const handleConvertToInvoice = () => {
    if (typeof onConvertToInvoice === "function") {
      onConvertToInvoice({ po, items, totals });
    }
  };

  const canConvert = po.status === "open" || po.status === "partially_fulfilled";

  return (
    <div className="po-page">
      <div className="po-toolbar no-print">
        {po.quotationRefNo && (
          <button type="button" className="po-link-btn" onClick={onBackToQuotation}>
            ← Created from Quotation {po.quotationRefNo}
          </button>
        )}
        <div className="po-toolbar-spacer" />
        <button type="button" className="po-btn po-btn-secondary" onClick={handlePrint}>
          Print / Save PDF
        </button>
        <button type="button" className="po-btn po-btn-secondary" onClick={addRow}>
          + Add item row
        </button>
        <button
          type="button"
          className="po-btn po-btn-primary"
          onClick={handleConvertToInvoice}
          disabled={!canConvert}
          title={canConvert ? "" : "Only open or partially fulfilled POs can be invoiced"}
        >
          Convert to Invoice
        </button>
      </div>

      <div className="po-sheet">
        {/* Header */}
        <div className="po-header">
          <input
            className="po-company-name"
            placeholder="Company Name"
            {...field("companyName")}
          />
          <div className="po-header-right">
            <div className="po-doc-title">Purchase Order</div>
            <span className={`po-status-badge po-status-${po.status}`}>
              {STATUS_LABEL[po.status] || po.status}
            </span>
          </div>
        </div>

        {/* PO meta */}
        <div className="po-row po-meta">
          <div className="po-cell">
            <span className="po-label">PO No.:</span>
            <input {...field("poNo")} />
          </div>
          <div className="po-cell">
            <span className="po-label">PO Date:</span>
            <input type="date" {...field("poDate")} />
          </div>
          <div className="po-cell">
            <span className="po-label">Expected Delivery:</span>
            <input type="date" {...field("expectedDeliveryDate")} />
          </div>
        </div>

        {/* Reference to source quotation */}
        <div className="po-row po-meta po-ref-row">
          <div className="po-cell">
            <span className="po-label">Against Quotation No.:</span>
            <input {...field("quotationRefNo")} placeholder="e.g. QT/2025/001" />
          </div>
          <div className="po-cell">
            <span className="po-label">Quotation Dated:</span>
            <input type="date" {...field("quotationRefDate")} />
          </div>
        </div>

        {/* Buyer + Supplier */}
        <div className="po-grid-2">
          <div className="po-block">
            <div className="po-block-title">Buyer (Placed By)</div>
            <div className="po-field">
              <span className="po-label">Name:</span>
              <input {...field("buyerName")} />
            </div>
            <div className="po-field">
              <span className="po-label">Address:</span>
              <input {...field("buyerAddress")} />
            </div>
            <div className="po-field">
              <span className="po-label">State:</span>
              <input {...field("buyerState")} />
            </div>
            <div className="po-field">
              <span className="po-label">State Code:</span>
              <input {...field("buyerStateCode")} />
            </div>
            <div className="po-field">
              <span className="po-label">GSTN No.:</span>
              <input {...field("buyerGSTN")} />
            </div>
          </div>
          <div className="po-block">
            <div className="po-block-title">Supplier (Billed To)</div>
            <div className="po-field">
              <span className="po-label">Name:</span>
              <input {...field("supplierName")} />
            </div>
            <div className="po-field">
              <span className="po-label">Address:</span>
              <input {...field("supplierAddress")} />
            </div>
            <div className="po-field">
              <span className="po-label">State:</span>
              <input {...field("supplierState")} />
            </div>
            <div className="po-field">
              <span className="po-label">State Code:</span>
              <input {...field("supplierStateCode")} />
            </div>
            <div className="po-field">
              <span className="po-label">GSTN No.:</span>
              <input {...field("supplierGSTN")} />
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="po-table">
          <thead>
            <tr>
              <th className="po-col-sl">Sl. No.</th>
              <th>Description and Specification of Goods / Services</th>
              <th className="po-col-qty">Qty</th>
              <th className="po-col-uom">UOM</th>
              <th className="po-col-rate">Rate per unit (₹)</th>
              <th className="po-col-total">Total (₹)</th>
              <th className="po-col-action no-print"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => (
              <tr key={row.id}>
                <td className="po-col-sl">{idx + 1}</td>
                <td>
                  <input
                    value={row.description}
                    onChange={(e) => updateItem(row.id, "description", e.target.value)}
                    placeholder="Item description"
                  />
                </td>
                <td className="po-col-qty">
                  <input
                    type="number"
                    min="0"
                    value={row.qty}
                    onChange={(e) => updateItem(row.id, "qty", e.target.value)}
                  />
                </td>
                <td className="po-col-uom">
                  <input
                    value={row.uom}
                    onChange={(e) => updateItem(row.id, "uom", e.target.value)}
                  />
                </td>
                <td className="po-col-rate">
                  <input
                    type="number"
                    min="0"
                    value={row.rate}
                    onChange={(e) => updateItem(row.id, "rate", e.target.value)}
                  />
                </td>
                <td className="po-col-total po-num">
                  {currency((Number(row.qty) || 0) * (Number(row.rate) || 0))}
                </td>
                <td className="po-col-action no-print">
                  <button
                    type="button"
                    className="po-remove"
                    onClick={() => removeRow(row.id)}
                    aria-label="Remove row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="po-total-label">Total</td>
              <td className="po-col-qty po-num">{totals.totalQty}</td>
              <td></td>
              <td></td>
              <td className="po-col-total po-num">₹ {currency(totals.totalPrice)}</td>
              <td className="no-print"></td>
            </tr>
          </tfoot>
        </table>

        {/* Terms */}
        <div className="po-grid-2 po-terms-grid">
          <div className="po-block">
            <div className="po-field po-field-stack">
              <span className="po-label">Delivery Terms:</span>
              <input {...field("deliveryTerms")} placeholder="e.g. Within 15 days of PO" />
            </div>
            <div className="po-field po-field-stack">
              <span className="po-label">Payment Terms:</span>
              <input {...field("paymentTerms")} placeholder="e.g. 30 days from invoice date" />
            </div>
          </div>
          <div className="po-block">
            <div className="po-field po-field-stack">
              <span className="po-label">Notes:</span>
              <input {...field("notes")} placeholder="Any additional instructions" />
            </div>
          </div>
        </div>

        <div className="po-signatory">
          <div className="po-signatory-line">For {po.buyerName || "Buyer Name"}</div>
          <div className="po-signatory-space" />
          <div className="po-signatory-line">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}
