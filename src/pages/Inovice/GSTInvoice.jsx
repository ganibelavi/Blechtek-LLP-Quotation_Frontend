import React, { useState, useMemo, useRef } from "react";
import "./GSTInvoice.css";

/**
 * GST Tax Invoice — editable, printable invoice page.
 * Mirrors the layout of a standard Indian GST tax invoice:
 * supplier + bank details, billed-to/shipped-to, item table,
 * SGST/CGST/IGST/TDS/Insurance totals, declarations, signatory.
 *
 * Usage: <GSTInvoice /> — drop into any React app. Print via the
 * "Print" button (uses window.print(), styled by the
 * @media print rules in GSTInvoice.css).
 */

let rowId = 1;
const newRow = () => ({
  id: rowId++,
  description: "",
  qty: 1,
  uom: "Nos.",
  rate: 0,
});

const emptyInvoice = {
  originalFor: "ORIGINAL FOR RECIPIENT",
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

  sgstPct: 9,
  cgstPct: 9,
  igstPct: 0,
  tdsPct: 0,
  insurance: 0,
};

function currency(n) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function GSTInvoice({ initialData, onBackToInvoiceList, onNavigate }) {
  const isViewOnly = true;

  const normalizedInitialData = initialData?.invoice
    ? initialData
    : { invoice: initialData, items: initialData?.items || [] };

  const [invoice, setInvoice] = useState(() => ({
    ...emptyInvoice,
    ...(normalizedInitialData?.invoice || {}),
  }));
  const [items, setItems] = useState(() => {
    if (normalizedInitialData?.items?.length) {
      return normalizedInitialData.items.map((row) => ({
        ...row,
        id: row.id || rowId++,
      }));
    }
    return [newRow()];
  });
  const printRef = useRef(null);

  const field = (key) => ({
    value: invoice[key],
    readOnly: isViewOnly,
    disabled: isViewOnly,
    onChange: (e) => setInvoice((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const updateItem = (id, key, value) => {
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  };

  const addRow = () => setItems((prev) => [...prev, newRow()]);
  const removeRow = (id) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );

  const totals = useMemo(() => {
    const totalQty = items.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const totalPrice = items.reduce(
      (s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0),
      0,
    );
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
    invoice.sgstPct,
    invoice.cgstPct,
    invoice.igstPct,
    invoice.tdsPct,
    invoice.insurance,
  ]);

  const handlePrint = () => {
    sessionStorage.setItem(
      "invoicePrintData",
      JSON.stringify({ invoice, items, totals }),
    );
    if (initialData?.id || initialData?.invoice?.id || invoice?.id) {
      sessionStorage.setItem(
        "invoicePrintId",
        String(initialData?.id ?? initialData?.invoice?.id ?? invoice?.id),
      );
    }
    if (typeof onNavigate === "function") {
      onNavigate("invoice-print");
      return;
    }
    window.print();
  };

  return (
    <div className="gi-page">
      <div className="gi-toolbar no-print">
        {/* {onBackToInvoiceList && (
          <button type="button" className="gi-btn gi-btn-secondary" onClick={onBackToInvoiceList} aria-label="Back to invoices list">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        )} */}
        <div className="gi-toolbar-spacer" />
        <button
          type="button"
          className="gi-btn gi-btn-primary"
          onClick={handlePrint}
        >
          Print
        </button>
        {/* <button type="button" className="gi-btn" onClick={addRow}>
          + Add item row
        </button> */}
        <button
          type="button"
          className="gi-btn gi-btn-secondary"
          onClick={onBackToInvoiceList}
          aria-label="Back to invoices list"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {/* <span>Back</span> */}
        </button>
      </div>

      <div className="gi-sheet" ref={printRef}>
        {/* Header */}
        <div className="gi-header">
          <div className="gi-logo">
            <img src="/logo/logo.png" alt="BlechTek Software Solutions LLP logo" />
          </div>
          <div className="gi-company-name">BlechTek Software Solutions LLP</div>
          <div className="gi-original-tag">{invoice.originalFor}</div>
        </div>

        {/* Invoice meta */}
        <div className="gi-row gi-meta">
          <div className="gi-cell">
            <span className="gi-label">Invoice No.:</span>
            <input {...field("invoiceNo")} />
          </div>
          <div className="gi-cell">
            <span className="gi-label">Time of Issue of Invoice:</span>
            <input {...field("timeOfIssue")} placeholder="Hrs" />
          </div>
        </div>
        <div className="gi-row gi-meta">
          <div className="gi-cell">
            <span className="gi-label">Date of Issue of Invoice:</span>
            <input type="date" {...field("dateOfIssue")} />
          </div>
          <div className="gi-cell">
            <span className="gi-label">Place of Service:</span>
            <input {...field("placeOfService")} placeholder="Place name" />
          </div>
        </div>

        {/* Supplier + Bank */}
        <div className="gi-grid-2">
          <div className="gi-block">
            <div className="gi-field">
              <span className="gi-label">Name:</span>
              <input {...field("supplierName")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">Address:</span>
              <input {...field("supplierAddress")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">State:</span>
              <input {...field("supplierState")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">State Code:</span>
              <input {...field("supplierStateCode")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">GSTN No.:</span>
              <input {...field("supplierGSTN")} />
            </div>
          </div>
          <div className="gi-block">
            <div className="gi-block-title">Bank Details</div>
            <div className="gi-field">
              <span className="gi-label">Bank Name / Branch:</span>
              <input {...field("bankName")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">Account No. / Type:</span>
              <input {...field("accountNo")} />
              <input className="gi-inline-small" {...field("accountType")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">IFSC Code:</span>
              <input {...field("ifsc")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">MSME Registration No.:</span>
              <input {...field("msmeNo")} />
            </div>
          </div>
        </div>

        {/* Receiver + Consignee */}
        <div className="gi-grid-2">
          <div className="gi-block">
            <div className="gi-block-title">
              Details of Receiver (Billed To)
            </div>
            <div className="gi-field">
              <span className="gi-label">Name:</span>
              <input {...field("receiverName")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">Address:</span>
              <input {...field("receiverAddress")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">State:</span>
              <input {...field("receiverState")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">State Code:</span>
              <input {...field("receiverStateCode")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">GSTN No.:</span>
              <input {...field("receiverGSTN")} />
            </div>
          </div>
          <div className="gi-block">
            <div className="gi-block-title">
              Details of Consignee (Shipped To)
            </div>
            <div className="gi-field">
              <span className="gi-label">Name:</span>
              <input {...field("consigneeName")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">Address:</span>
              <input {...field("consigneeAddress")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">State:</span>
              <input {...field("consigneeState")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">State Code:</span>
              <input {...field("consigneeStateCode")} />
            </div>
            <div className="gi-field">
              <span className="gi-label">GSTN No.:</span>
              <input {...field("consigneeGSTN")} />
            </div>
          </div>
        </div>

        {/* PO / HSN / SAC */}
        <div className="gi-row gi-meta">
          <div className="gi-cell">
            <span className="gi-label">Your Purchase Order No. / Dated:</span>
            <input {...field("poNoDate")} />
          </div>
          <div className="gi-cell">
            <span className="gi-label">HSN Code:</span>
            <input {...field("hsnCode")} />
          </div>
          <div className="gi-cell">
            <span className="gi-label">SAC Code:</span>
            <input {...field("sacCode")} />
          </div>
        </div>

        {/* Items table */}
        <table className="gi-table">
          <thead>
            <tr>
              <th className="gi-col-sl">Sl. No.</th>
              <th>Description and Specification of Goods / Services</th>
              <th className="gi-col-qty">Qty</th>
              <th className="gi-col-uom">UOM</th>
              <th className="gi-col-rate">Rate per unit (₹)</th>
              <th className="gi-col-total">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => (
              <tr key={row.id}>
                <td className="gi-col-sl">{idx + 1}</td>
                <td>
                  <input
                    value={row.description}
                    readOnly={isViewOnly}
                    disabled={isViewOnly}
                    onChange={(e) =>
                      updateItem(row.id, "description", e.target.value)
                    }
                    placeholder="Item description"
                  />
                </td>
                <td className="gi-col-qty">
                  <input
                    type="number"
                    min="0"
                    value={row.qty}
                    readOnly={isViewOnly}
                    disabled={isViewOnly}
                    onChange={(e) => updateItem(row.id, "qty", e.target.value)}
                  />
                </td>
                <td className="gi-col-uom">
                  <input
                    value={row.uom}
                    readOnly={isViewOnly}
                    disabled={isViewOnly}
                    onChange={(e) => updateItem(row.id, "uom", e.target.value)}
                  />
                </td>
                <td className="gi-col-rate">
                  <input
                    type="number"
                    min="0"
                    value={row.rate}
                    readOnly={isViewOnly}
                    disabled={isViewOnly}
                    onChange={(e) => updateItem(row.id, "rate", e.target.value)}
                  />
                </td>
                <td className="gi-col-total gi-num">
                  {currency((Number(row.qty) || 0) * (Number(row.rate) || 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="gi-total-label">
                Total
              </td>
              <td className="gi-col-qty gi-num">{totals.totalQty}</td>
              <td></td>
              <td></td>
              <td className="gi-col-total gi-num">
                {currency(totals.totalPrice)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Declarations + Totals */}
        <div className="gi-grid-2 gi-footer-grid">
          <div className="gi-block">
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
              <input {...field("reverseCharge")} />
            </div>
            <div className="gi-field gi-field-stack">
              <span className="gi-label">Amount in Words:</span>
              <input {...field("amountInWords")} />
            </div>
            <p className="gi-declaration">
              I/We hereby certify that my/our registration certificate under the
              GST Act, 2017 is in force on the date on which the sale of the
              goods specified in the tax invoice is made by me/us and that the
              transaction of sale covered by this tax invoice has been effected
              by me/us and it shall be accounted for in the turnover of sales
              while filing of return and the due tax, if any payable on this
              sale has been paid or shall be paid.
            </p>
          </div>

          <div className="gi-block gi-totals-block">
            <table className="gi-totals-table">
              <tbody>
                <tr>
                  <td>
                    Add SGST @{" "}
                    <input
                      type="number"
                      className="gi-inline-pct"
                      {...field("sgstPct")}
                    />
                    %
                  </td>
                  <td className="gi-num">{currency(totals.sgst)}</td>
                </tr>
                <tr>
                  <td>
                    Add CGST @{" "}
                    <input
                      type="number"
                      className="gi-inline-pct"
                      {...field("cgstPct")}
                    />
                    %
                  </td>
                  <td className="gi-num">{currency(totals.cgst)}</td>
                </tr>
                <tr>
                  <td>
                    Add IGST @{" "}
                    <input
                      type="number"
                      className="gi-inline-pct"
                      {...field("igstPct")}
                    />
                    %
                  </td>
                  <td className="gi-num">{currency(totals.igst)}</td>
                </tr>
                <tr className="gi-subtotal-row">
                  <td>Subtotal</td>
                  <td className="gi-num">{currency(totals.subtotal)}</td>
                </tr>
                <tr>
                  <td>
                    Less TDS @{" "}
                    <input
                      type="number"
                      className="gi-inline-pct"
                      {...field("tdsPct")}
                    />
                    %
                  </td>
                  <td className="gi-num">{currency(totals.tds)}</td>
                </tr>
                <tr>
                  <td>
                    Insurance{" "}
                    <input
                      type="number"
                      className="gi-inline-pct"
                      {...field("insurance")}
                    />
                  </td>
                  <td className="gi-num">{currency(totals.insurance)}</td>
                </tr>
                <tr className="gi-grand-total-row">
                  <td>Grand Total</td>
                  <td className="gi-num">₹ {currency(totals.grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            <div className="gi-field gi-field-stack">
              <span className="gi-label">Terms of Sale:</span>
              <input {...field("termsOfSale")} />
            </div>
          </div>
        </div>

        <div className="gi-signatory">
          <div className="gi-signatory-line">
            For BlechTek Software Solutions LLP
          </div>
          <div className="gi-signatory-space">
            <img src="/logo/Authority_Seal.png" alt="Authority seal" />
          </div>
          <div className="gi-signatory-line">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}
