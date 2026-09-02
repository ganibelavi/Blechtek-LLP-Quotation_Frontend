import React, { useEffect, useMemo, useState } from "react";
import "./PurchaseOrder.css";
import { fetchPurchaseOrderById } from "../../services/quotationApi";

const emptyPO = {
  companyName: "Your Company Name",
  poNo: "",
  poDate: "",
  status: "open",
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

export default function PurchaseOrderPrint({ initialData, onBack }) {
  const [po, setPo] = useState({ ...emptyPO, ...(initialData?.po || initialData || {}) });
  const [items, setItems] = useState(
    initialData?.items?.length
      ? initialData.items.map((row, index) => ({ ...row, id: row.id ?? index + 1 }))
      : [],
  );
  const [loading, setLoading] = useState(true);
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = sessionStorage.getItem("purchaseOrderPrintData");
        const preferred = stored ? JSON.parse(stored) : null;

        const source = preferred || initialData;

        if (source) {
          const normalized = source.po ? source : { po: source, items: source.items || [] };
          setPo({ ...emptyPO, ...(normalized.po || {}) });
          setItems(
            normalized.items?.length
              ? normalized.items.map((row, index) => ({ ...row, id: row.id ?? index + 1 }))
              : [],
          );
          setLoading(false);
          return;
        }

        const printId = sessionStorage.getItem("purchaseOrderPrintId");
        if (printId) {
          const remote = await fetchPurchaseOrderById(Number(printId));
          const normalized = remote?.po ? remote : { po: remote, items: remote?.items || [] };
          setPo({ ...emptyPO, ...(normalized.po || remote || {}) });
          setItems(
            (normalized.items || remote?.items || []).map((row, index) => ({ ...row, id: row.id ?? index + 1 })),
          );
        }
      } catch (error) {
        console.error("Failed to load purchase order print data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [initialData]);

  const totals = useMemo(() => {
    const totalQty = items.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
    const totalPrice = items.reduce(
      (sum, row) => sum + (Number(row.qty) || 0) * (Number(row.rate) || 0),
      0,
    );

    return { totalQty, totalPrice };
  }, [items]);

  useEffect(() => {
    if (loading || hasAutoPrinted) {
      return;
    }

    const timer = setTimeout(() => {
      setHasAutoPrinted(true);
      window.print();
    }, 450);

    return () => clearTimeout(timer);
  }, [loading, hasAutoPrinted]);

  if (loading) {
    return (
      <div className="po-page">
        <div className="po-sheet">
          <p>Loading purchase order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="po-page">
      <div className="po-toolbar no-print">
        <div className="po-toolbar-spacer" />
        <button type="button" className="po-btn po-btn-primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        {onBack && (
          <button type="button" className="po-btn po-btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
      </div>

      <div className="po-sheet">
        <div className="po-header">
          <div className="po-company-name">{po.companyName || "Your Company Name"}</div>
          <div className="po-header-right">
            <div className="po-doc-title">Purchase Order</div>
            <span className={`po-status-badge po-status-${po.status}`}>
              {STATUS_LABEL[po.status] || po.status}
            </span>
          </div>
        </div>

        <div className="po-row po-meta">
          <div className="po-cell">
            <span className="po-label">PO No.:</span>
            <span>{po.poNo || "-"}</span>
          </div>
          <div className="po-cell">
            <span className="po-label">PO Date:</span>
            <span>{formatDate(po.poDate)}</span>
          </div>
          <div className="po-cell">
            <span className="po-label">Expected Delivery:</span>
            <span>{formatDate(po.expectedDeliveryDate)}</span>
          </div>
        </div>

        <div className="po-row po-meta po-ref-row">
          <div className="po-cell">
            <span className="po-label">Against Quotation No.:</span>
            <span>{po.quotationRefNo || "-"}</span>
          </div>
          <div className="po-cell">
            <span className="po-label">Quotation Dated:</span>
            <span>{formatDate(po.quotationRefDate)}</span>
          </div>
        </div>

        <div className="po-grid-2">
          <div className="po-block">
            <div className="po-block-title">Buyer (Placed By)</div>
            <div className="po-field"><span className="po-label">Name:</span><span>{po.buyerName || "-"}</span></div>
            <div className="po-field"><span className="po-label">Address:</span><span>{po.buyerAddress || "-"}</span></div>
            <div className="po-field"><span className="po-label">State:</span><span>{po.buyerState || "-"}</span></div>
            <div className="po-field"><span className="po-label">State Code:</span><span>{po.buyerStateCode || "-"}</span></div>
            <div className="po-field"><span className="po-label">GSTN No.:</span><span>{po.buyerGSTN || "-"}</span></div>
          </div>
          <div className="po-block">
            <div className="po-block-title">Supplier (Billed To)</div>
            <div className="po-field"><span className="po-label">Name:</span><span>{po.supplierName || "-"}</span></div>
            <div className="po-field"><span className="po-label">Address:</span><span>{po.supplierAddress || "-"}</span></div>
            <div className="po-field"><span className="po-label">State:</span><span>{po.supplierState || "-"}</span></div>
            <div className="po-field"><span className="po-label">State Code:</span><span>{po.supplierStateCode || "-"}</span></div>
            <div className="po-field"><span className="po-label">GSTN No.:</span><span>{po.supplierGSTN || "-"}</span></div>
          </div>
        </div>

        <table className="po-table">
          <thead>
            <tr>
              <th className="po-col-sl">Sl. No.</th>
              <th>Description and Specification of Goods / Services</th>
              <th className="po-col-qty">Qty</th>
              <th className="po-col-uom">UOM</th>
              <th className="po-col-rate">Rate</th>
              <th className="po-col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((row, index) => (
                <tr key={row.id ?? `${row.description}-${index}`}>
                  <td className="po-col-sl">{index + 1}</td>
                  <td>{row.description || "-"}</td>
                  <td className="po-col-qty">{Number(row.qty) || 0}</td>
                  <td className="po-col-uom">{row.uom || "Nos."}</td>
                  <td className="po-col-rate">₹ {currency(Number(row.rate) || 0)}</td>
                  <td className="po-col-amount">₹ {currency((Number(row.qty) || 0) * (Number(row.rate) || 0))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="po-empty-row">No items found</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="po-summary">
          <div className="po-summary-row">
            <span className="po-label">Total Quantity:</span>
            <span>{totals.totalQty}</span>
          </div>
          <div className="po-summary-row po-summary-row--total">
            <span className="po-label">Total Amount:</span>
            <strong>₹ {currency(totals.totalPrice)}</strong>
          </div>
        </div>

        <div className="po-terms">
          <div className="po-field">
            <span className="po-label">Delivery Terms:</span>
            <span>{po.deliveryTerms || "-"}</span>
          </div>
          <div className="po-field">
            <span className="po-label">Payment Terms:</span>
            <span>{po.paymentTerms || "-"}</span>
          </div>
          {po.notes && (
            <div className="po-field">
              <span className="po-label">Notes:</span>
              <span>{po.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
