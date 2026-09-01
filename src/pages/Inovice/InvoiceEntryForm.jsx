import React, { useEffect, useMemo, useState } from "react";
import SearchDropdown from "../../components/SearchDropdown";
import {
  createInvoice,
  fetchOrganizations,
  fetchPurchaseOrderById,
  fetchQuotationById,
  fetchQuotations,
} from "../../services/quotationApi";

const readStoredPurchaseOrder = () => {
  try {
    const raw = sessionStorage.getItem("purchaseOrderData");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to read purchase order info", error);
    return null;
  }
};

const readStoredQuotation = () => {
  try {
    const raw = sessionStorage.getItem("selectedQuotationForPo");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to read selected quotation info", error);
    return null;
  }
};

const emptyItem = (description = "", isSourceData = false) => ({
  id: Date.now() + Math.random(),
  description,
  qty: 1,
  uom: "Nos.",
  rate: 0,
  isSourceData,
});

const defaultForm = () => {
  const po = readStoredPurchaseOrder();
  const quotation = readStoredQuotation();
  const poDetails = po?.po || {};
  const itemRows = Array.isArray(po?.items) && po.items.length
    ? po.items.map((item) => ({
        id: Date.now() + Math.random() + Math.floor(Math.random() * 1000),
        description: item.description || "",
        qty: Number(item.qty) || 1,
        uom: item.uom || "Nos.",
        rate: Number(item.rate) || 0,
        isSourceData: true,
      }))
    : [emptyItem("", true)];

  return {
    sourcePoId: poDetails.id || po?.id || null,
    sourceQuotationId: quotation?.quotationId || po?.quotationId || null,
    originalFor: "ORIGINAL FOR RECIPIENT",
    companyName: poDetails.companyName || "",
    invoiceNo: "",
    dateOfIssue: new Date().toISOString().slice(0, 10),
    timeOfIssue: "",
    placeOfService: "",
    supplierName: poDetails.supplierName || "",
    supplierAddress: poDetails.supplierAddress || "",
    supplierState: poDetails.supplierState || "",
    supplierStateCode: poDetails.supplierStateCode || "",
    supplierGSTN: poDetails.supplierGSTN || "",
    bankName: "",
    accountNo: "",
    accountType: "Current",
    ifsc: "",
    msmeNo: "",
    receiverName: poDetails.buyerName || "",
    receiverAddress: poDetails.buyerAddress || "",
    receiverState: poDetails.buyerState || "",
    receiverStateCode: poDetails.buyerStateCode || "",
    receiverGSTN: poDetails.buyerGSTN || "",
    consigneeName: poDetails.buyerName || "",
    consigneeAddress: poDetails.buyerAddress || "",
    consigneeState: poDetails.buyerState || "",
    consigneeStateCode: poDetails.buyerStateCode || "",
    consigneeGSTN: poDetails.buyerGSTN || "",
    poNoDate: poDetails.poNo ? `PO No. ${poDetails.poNo} / ${poDetails.poDate || ""}` : "",
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
    items: itemRows,
  };
};

export default function InvoiceEntryForm({ onNavigate, defaultReturnView = "created-invoices" }) {
  const [form, setForm] = useState(defaultForm);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [quotationRecords, setQuotationRecords] = useState([]);
  const isPreloadedSource = Boolean(form.sourcePoId || form.sourceQuotationId);
  const isItemLocked = (item) => Boolean(item?.isSourceData);

  useEffect(() => {
    fetchOrganizations()
      .then(setCompanyOptions)
      .catch(() => setCompanyOptions([]));

    fetchQuotations(1, 500)
      .then((data) => setQuotationRecords(Array.isArray(data) ? data : []))
      .catch(() => setQuotationRecords([]));
  }, []);

  useEffect(() => {
    const rawPo = readStoredPurchaseOrder();
    const rawQuotation = readStoredQuotation();

    const hydrateSourceData = async () => {
      const purchaseOrder = rawPo?.po || rawPo;
      const sourcePoId = purchaseOrder?.id || rawPo?.id || null;
      const sourceQuotationId = rawQuotation?.quotationId || purchaseOrder?.quotationId || rawPo?.quotationId || null;
      if (!sourcePoId && !sourceQuotationId) return;

      try {
        if (sourcePoId) {
          const remotePurchaseOrder = await fetchPurchaseOrderById(sourcePoId);
          if (remotePurchaseOrder) {
            const poPayload = remotePurchaseOrder.po || remotePurchaseOrder;
            const itemRows = Array.isArray(remotePurchaseOrder.items || poPayload.items)
              ? (remotePurchaseOrder.items || poPayload.items).map((item) => ({
                  id: Date.now() + Math.random() + Math.floor(Math.random() * 1000),
                  description: item.description || "",
                  qty: Number(item.qty) || 1,
                  uom: item.uom || "Nos.",
                  rate: Number(item.rate) || 0,
                  isSourceData: true,
                }))
              : [emptyItem("", true)];

            setForm((prev) => ({
              ...prev,
              sourcePoId: remotePurchaseOrder.id || prev.sourcePoId || null,
              companyName: poPayload.companyName || prev.companyName || "",
              supplierName: poPayload.supplierName || prev.supplierName || "",
              supplierAddress: poPayload.supplierAddress || prev.supplierAddress || "",
              supplierState: poPayload.supplierState || prev.supplierState || "",
              supplierStateCode: poPayload.supplierStateCode || prev.supplierStateCode || "",
              supplierGSTN: poPayload.supplierGSTN || prev.supplierGSTN || "",
              receiverName: poPayload.buyerName || prev.receiverName || "",
              receiverAddress: poPayload.buyerAddress || prev.receiverAddress || "",
              receiverState: poPayload.buyerState || prev.receiverState || "",
              receiverStateCode: poPayload.buyerStateCode || prev.receiverStateCode || "",
              receiverGSTN: poPayload.buyerGSTN || prev.receiverGSTN || "",
              consigneeName: poPayload.buyerName || prev.consigneeName || "",
              consigneeAddress: poPayload.buyerAddress || prev.consigneeAddress || "",
              consigneeState: poPayload.buyerState || prev.consigneeState || "",
              consigneeStateCode: poPayload.buyerStateCode || prev.consigneeStateCode || "",
              consigneeGSTN: poPayload.buyerGSTN || prev.consigneeGSTN || "",
              poNoDate: poPayload.poNo ? `PO No. ${poPayload.poNo} / ${poPayload.poDate || ""}` : prev.poNoDate || "",
              items: itemRows,
            }));
          }
        }

        if (sourceQuotationId) {
          const remoteQuotation = await fetchQuotationById(sourceQuotationId);
          if (remoteQuotation) {
            setForm((prev) => ({
              ...prev,
              sourceQuotationId: remoteQuotation.quotationId || prev.sourceQuotationId || null,
              companyName: remoteQuotation.organizationName || prev.companyName || "",
              supplierName: prev.supplierName || remoteQuotation.organizationName || "",
              receiverName: prev.receiverName || remoteQuotation.quotationToName || "",
              receiverAddress: prev.receiverAddress || remoteQuotation.quotationToAddress || "",
              consigneeName: prev.consigneeName || remoteQuotation.quotationToName || "",
              consigneeAddress: prev.consigneeAddress || remoteQuotation.quotationToAddress || "",
              poNoDate: prev.poNoDate || (remoteQuotation.quotationNo ? `Quotation No. ${remoteQuotation.quotationNo}` : ""),
            }));
          }
        }
      } catch (error) {
        console.error("Failed to hydrate invoice source data", error);
      }
    };

    hydrateSourceData();
  }, []);

  useEffect(() => {
    const selectedCompanyName = form.companyName?.trim();
    if (!selectedCompanyName) return;

    const matchedQuotation = quotationRecords.find(
      (quotation) =>
        (quotation.organizationName || "").trim().toLowerCase() ===
        selectedCompanyName.toLowerCase(),
    );

    if (!matchedQuotation) return;

    setForm((prev) => {
      if ((prev.companyName || "").trim().toLowerCase() !== selectedCompanyName.toLowerCase()) {
        return prev;
      }

      const nextItems = prev.items.map((item, index) => {
        if (index !== 0 || item.description) return item;
        return {
          ...item,
          description: (matchedQuotation.modules || []).join(", ") || item.description,
        };
      });

      return {
        ...prev,
        companyName: matchedQuotation.organizationName || prev.companyName,
        supplierName: prev.supplierName || matchedQuotation.organizationName || "",
        receiverName: prev.receiverName || matchedQuotation.quotationToName || "",
        receiverAddress: prev.receiverAddress || matchedQuotation.quotationToAddress || "",
        consigneeName: prev.consigneeName || matchedQuotation.quotationToName || "",
        consigneeAddress: prev.consigneeAddress || matchedQuotation.quotationToAddress || "",
        poNoDate: prev.poNoDate || (matchedQuotation.quotationNo ? `Quotation No. ${matchedQuotation.quotationNo}` : ""),
        items: nextItems,
      };
    });
  }, [form.companyName, quotationRecords]);

  const totals = useMemo(() => {
    const totalQty = form.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const totalPrice = form.items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0),
      0,
    );
    const sgst = (totalPrice * (Number(form.sgstPct) || 0)) / 100;
    const cgst = (totalPrice * (Number(form.cgstPct) || 0)) / 100;
    const igst = (totalPrice * (Number(form.igstPct) || 0)) / 100;
    const subtotal = totalPrice + sgst + cgst + igst;
    const tds = (subtotal * (Number(form.tdsPct) || 0)) / 100;
    const insurance = Number(form.insurance) || 0;
    const grandTotal = subtotal - tds + insurance;

    return { totalQty, totalPrice, sgst, cgst, igst, subtotal, tds, insurance, grandTotal };
  }, [form]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
  };

  const addRow = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeRow = (id) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((row) => row.id !== id) : prev.items,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      poId: form.sourcePoId || null,
      quotationId: form.sourceQuotationId || null,
      originalFor: form.originalFor,
      companyName: form.companyName,
      invoiceNo: form.invoiceNo,
      dateOfIssue: form.dateOfIssue,
      timeOfIssue: form.timeOfIssue,
      placeOfService: form.placeOfService,
      supplierName: form.supplierName,
      supplierAddress: form.supplierAddress,
      supplierState: form.supplierState,
      supplierStateCode: form.supplierStateCode,
      supplierGSTN: form.supplierGSTN,
      bankName: form.bankName,
      accountNo: form.accountNo,
      accountType: form.accountType,
      ifsc: form.ifsc,
      msmeNo: form.msmeNo,
      receiverName: form.receiverName,
      receiverAddress: form.receiverAddress,
      receiverState: form.receiverState,
      receiverStateCode: form.receiverStateCode,
      receiverGSTN: form.receiverGSTN,
      consigneeName: form.consigneeName,
      consigneeAddress: form.consigneeAddress,
      consigneeState: form.consigneeState,
      consigneeStateCode: form.consigneeStateCode,
      consigneeGSTN: form.consigneeGSTN,
      poNoDate: form.poNoDate,
      hsnCode: form.hsnCode,
      sacCode: form.sacCode,
      reverseCharge: form.reverseCharge,
      amountInWords: form.amountInWords,
      termsOfSale: form.termsOfSale,
      sgstPct: Number(form.sgstPct) || 0,
      cgstPct: Number(form.cgstPct) || 0,
      igstPct: Number(form.igstPct) || 0,
      tdsPct: Number(form.tdsPct) || 0,
      insurance: Number(form.insurance) || 0,
      totalAmount: totals.grandTotal,
      items: form.items.map((item) => ({
        description: item.description,
        qty: Number(item.qty) || 1,
        uom: item.uom || "Nos.",
        rate: Number(item.rate) || 0,
      })),
    };

    try {
      const saved = await createInvoice(payload);

      sessionStorage.setItem("invoiceData", JSON.stringify({
        invoice: payload,
        items: payload.items,
        totals,
        id: saved.id,
      }));

      onNavigate("invoice");
    } catch (error) {
      console.error("Failed to save invoice", error);
      window.alert("Unable to save invoice to database. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto"}}>
      <form onSubmit={handleSubmit}>
        <div className="app-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 18, paddingBottom: 12, gap: 16 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "#000" }}>GST Invoice Entry</h1>
            <span aria-hidden="true" />
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
            <button
              type="button"
              className="app-action-btn app-action-btn--secondary"
              onClick={() => onNavigate(sessionStorage.getItem("invoiceBackView") || defaultReturnView)}
              aria-label="Back to previous page"
              title="Back to previous page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button type="submit" className="app-action-btn app-action-btn--primary">
              Save & Open Invoice
            </button>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div>
              <SearchDropdown
                name="companyName"
                label="Company Name"
                value={form.companyName}
                onChange={(value) => updateField("companyName", value)}
                options={companyOptions}
                placeholder="Select or type company name"
                allowFreeText
                disabled={isPreloadedSource}
              />
            </div>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Invoice No.</div>
              <input value={form.invoiceNo} onChange={(e) => updateField("invoiceNo", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Date of Issue</div>
              <input type="date" value={form.dateOfIssue} onChange={(e) => updateField("dateOfIssue", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Time of Issue</div>
              <input value={form.timeOfIssue} onChange={(e) => updateField("timeOfIssue", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Place of Service</div>
              <input value={form.placeOfService} onChange={(e) => updateField("placeOfService", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>PO No. / Date</div>
              <input value={form.poNoDate} onChange={(e) => updateField("poNoDate", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} />
            </label>
          </div>

          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Supplier Details</h3>
              <label>Name<input value={form.supplierName} onChange={(e) => updateField("supplierName", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
              <label>Address<input value={form.supplierAddress} onChange={(e) => updateField("supplierAddress", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
              <label>State<input value={form.supplierState} onChange={(e) => updateField("supplierState", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
              <label>State Code<input value={form.supplierStateCode} onChange={(e) => updateField("supplierStateCode", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
              <label>GSTN No.<input value={form.supplierGSTN} onChange={(e) => updateField("supplierGSTN", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Receiver / Consignee</h3>
              <label>Name<input value={form.receiverName} onChange={(e) => updateField("receiverName", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
              <label>Address<input value={form.receiverAddress} onChange={(e) => updateField("receiverAddress", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
              <label>State<input value={form.receiverState} onChange={(e) => updateField("receiverState", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
              <label>State Code<input value={form.receiverStateCode} onChange={(e) => updateField("receiverStateCode", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
              <label>GSTN No.<input value={form.receiverGSTN} onChange={(e) => updateField("receiverGSTN", e.target.value)} style={inputStyle} readOnly={isPreloadedSource} /></label>
            </div>
          </div>

          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Bank Name / Branch</div>
              <input value={form.bankName} onChange={(e) => updateField("bankName", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Account No.</div>
              <input value={form.accountNo} onChange={(e) => updateField("accountNo", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Account Type</div>
              <input value={form.accountType} onChange={(e) => updateField("accountType", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>IFSC</div>
              <input value={form.ifsc} onChange={(e) => updateField("ifsc", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>MSME No.</div>
              <input value={form.msmeNo} onChange={(e) => updateField("msmeNo", e.target.value)} style={inputStyle} />
            </label>
          </div>

          <div style={{ marginTop: 24 }}>
            <h3 style={sectionTitleStyle}>Items</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={tdStyle}>Description</th>
                    <th style={tdStyle}>Qty</th>
                    <th style={tdStyle}>UOM</th>
                    <th style={tdStyle}>Rate</th>
                    <th style={tdStyle}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item) => (
                    <tr key={item.id}>
                      <td style={tdStyle}><input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} style={inputStyle} readOnly={isItemLocked(item)} /></td>
                      <td style={tdStyle}><input type="number" min="0" step="0.01" value={item.qty} onChange={(e) => updateItem(item.id, "qty", Number(e.target.value) || 0)} style={inputStyle} readOnly={isItemLocked(item)} /></td>
                      <td style={tdStyle}><input value={item.uom} onChange={(e) => updateItem(item.id, "uom", e.target.value)} style={inputStyle} readOnly={isItemLocked(item)} /></td>
                      <td style={tdStyle}><input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateItem(item.id, "rate", Number(e.target.value) || 0)} style={inputStyle} readOnly={isItemLocked(item)} /></td>
                      <td style={tdStyle}>₹{((Number(item.qty) || 0) * (Number(item.rate) || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>HSN Code</div>
              <input value={form.hsnCode} onChange={(e) => updateField("hsnCode", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>SAC Code</div>
              <input value={form.sacCode} onChange={(e) => updateField("sacCode", e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Reverse Charge</div>
              <select value={form.reverseCharge} onChange={(e) => updateField("reverseCharge", e.target.value)} style={inputStyle}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>SGST %</div>
              <input type="number" step="0.01" value={form.sgstPct} onChange={(e) => updateField("sgstPct", Number(e.target.value) || 0)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>CGST %</div>
              <input type="number" step="0.01" value={form.cgstPct} onChange={(e) => updateField("cgstPct", Number(e.target.value) || 0)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>IGST %</div>
              <input type="number" step="0.01" value={form.igstPct} onChange={(e) => updateField("igstPct", Number(e.target.value) || 0)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>TDS %</div>
              <input type="number" step="0.01" value={form.tdsPct} onChange={(e) => updateField("tdsPct", Number(e.target.value) || 0)} style={inputStyle} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Insurance</div>
              <input type="number" step="0.01" value={form.insurance} onChange={(e) => updateField("insurance", Number(e.target.value) || 0)} style={inputStyle} />
            </label>
          </div>

          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Terms of Sale</div>
              <textarea value={form.termsOfSale} onChange={(e) => updateField("termsOfSale", e.target.value)} style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Amount in Words</div>
              <textarea value={form.amountInWords} onChange={(e) => updateField("amountInWords", e.target.value)} style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} />
            </label>
          </div>

          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 16, fontWeight: 700 }}>
            <span>Total Qty: {totals.totalQty}</span>
            <span>Grand Total: ₹{totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const sectionStyle = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  display: "grid",
  gap: 10,
};

const sectionTitleStyle = {
  margin: "0 0 8px",
  fontSize: 18,
};

const tdStyle = {
  border: "1px solid #e5e7eb",
  padding: 8,
  textAlign: "left",
  verticalAlign: "top",
};

const smallButton = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
};
