import React, { useEffect, useMemo, useState } from "react";
import SearchDropdown from "../../components/SearchDropdown";
import {
  createPurchaseOrder,
  fetchModules,
  fetchOrganizations,
  fetchQuotationById,
  fetchQuotations,
} from "../../services/quotationApi";

const readStoredQuotation = () => {
  try {
    const storedQuotation = sessionStorage.getItem("selectedQuotationForPo");
    return storedQuotation ? JSON.parse(storedQuotation) : null;
  } catch (error) {
    console.error("Failed to read selected quotation info", error);
    return null;
  }
};

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const emptyItem = (description = "", isSourceData = false, rate = 0) => ({
  id: Date.now() + Math.random(),
  description,
  qty: 1,
  uom: "Nos.",
  rate,
  isSourceData,
});

const getModuleName = (module) => {
  if (!module) return "";
  if (typeof module === "string") return module.trim();
  return (
    module.moduleName ||
    module.ModuleName ||
    module.module ||
    module.name ||
    module.Module ||
    ""
  ).trim();
};

const getModulePrice = (module, moduleCatalog = []) => {
  if (module && typeof module !== "string") {
    const directPrice = Number(module.price ?? module.Price ?? 0);
    if (Number.isFinite(directPrice) && directPrice > 0) {
      return directPrice;
    }
  }

  const name = getModuleName(module);
  if (!name) return 0;

  const normalized = name.toLowerCase();
  const catalogMatch = moduleCatalog.find((catalogItem) => {
    const catalogName = (catalogItem?.module ?? catalogItem?.moduleName ?? catalogItem?.ModuleName ?? catalogItem?.name ?? "").trim().toLowerCase();
    return catalogName === normalized;
  });

  const catalogPrice = Number(catalogMatch?.price ?? catalogMatch?.Price ?? 0);
  return Number.isFinite(catalogPrice) ? catalogPrice : 0;
};

const buildQuotationItems = (quotation, moduleCatalog = []) => {
  const moduleDetails = Array.isArray(quotation?.moduleDetails)
    ? quotation.moduleDetails.filter(Boolean)
    : [];
  const modules = Array.isArray(quotation?.modules)
    ? quotation.modules.filter(Boolean)
    : [];

  const rows = moduleDetails.length > 0 ? moduleDetails : modules;

  if (rows.length === 0) {
    return [emptyItem("", true)];
  }

  return rows
    .map((module) => {
      const name = getModuleName(module);
      if (!name) return null;
      const price = getModulePrice(module, moduleCatalog);
      return emptyItem(name, true, price);
    })
    .filter(Boolean);
};

const defaultForm = () => {
  const quotation = readStoredQuotation();

  return {
    sourceQuotationId: normalizeId(quotation?.quotationId),
    companyName: quotation?.organizationName || "",
    poNo: "",
    poDate: new Date().toISOString().slice(0, 10),
    status: "open",
    quotationRefNo: quotation?.quotationNo || "",
    quotationRefDate: quotation?.date || "",
    buyerName: quotation?.quotationToName || "",
    buyerAddress: quotation?.quotationToAddress || "",
    buyerState: "",
    buyerStateCode: "",
    buyerGSTN: "",
    supplierName: quotation?.organizationName || "",
    supplierAddress: "",
    supplierState: "",
    supplierStateCode: "",
    supplierGSTN: "",
    deliveryTerms: "",
    paymentTerms: "",
    expectedDeliveryDate: "",
    notes: "",
    items: buildQuotationItems(quotation, []),
  };
};

export default function PurchaseOrderEntryForm({
  onNavigate,
  defaultReturnView = "created-purchase-orders",
}) {
  const [form, setForm] = useState(defaultForm);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [quotationRecords, setQuotationRecords] = useState([]);
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const isQuotationLocked = Boolean(form.sourceQuotationId);
  const isItemLocked = (item) => Boolean(item?.isSourceData);

  useEffect(() => {
    fetchModules()
      .then((data) => setModuleCatalog(Array.isArray(data) ? data : []))
      .catch(() => setModuleCatalog([]));

    fetchOrganizations()
      .then(setCompanyOptions)
      .catch(() => setCompanyOptions([]));

    fetchQuotations(1, 500)
      .then((data) => setQuotationRecords(Array.isArray(data) ? data : []))
      .catch(() => setQuotationRecords([]));
  }, []);

  useEffect(() => {
    if (!moduleCatalog.length) return;

    setForm((prev) => {
      const sourceItems = prev.items.filter((item) => item.isSourceData);
      if (!sourceItems.length) return prev;

      const rebuiltItems = buildQuotationItems(
        { modules: sourceItems.map((item) => item.description) },
        moduleCatalog,
      );

      const hasMissingRate = sourceItems.some(
        (item) => Number(item.rate) === 0 && item.description,
      );

      if (!hasMissingRate) return prev;

      return { ...prev, items: rebuiltItems };
    });
  }, [moduleCatalog]);

  useEffect(() => {
    const selectedQuotation = readStoredQuotation();

    if (!selectedQuotation) return;

    const hydrateFromQuotation = (quotation) => {
      setForm((prev) => ({
        ...prev,
        sourceQuotationId: normalizeId(
          quotation.quotationId || prev.sourceQuotationId || null,
        ),
        companyName: quotation.organizationName || prev.companyName || "",
        quotationRefNo: quotation.quotationNo || prev.quotationRefNo || "",
        quotationRefDate: quotation.date || prev.quotationRefDate || "",
        buyerName: quotation.quotationToName || prev.buyerName || "",
        buyerAddress: quotation.quotationToAddress || prev.buyerAddress || "",
        supplierName: quotation.organizationName || prev.supplierName || "",
        items: buildQuotationItems(quotation, moduleCatalog),
      }));
    };

    const hydrateFromStored = async () => {
      if (normalizeId(selectedQuotation.quotationId)) {
        try {
          const remoteQuotation = await fetchQuotationById(
            normalizeId(selectedQuotation.quotationId),
          );
          if (remoteQuotation) {
            hydrateFromQuotation(remoteQuotation);
            return;
          }
        } catch (error) {
          console.error("Failed to load quotation by id for PO", error);
        }
      }

      hydrateFromQuotation(selectedQuotation);
    };

    hydrateFromStored();
    sessionStorage.removeItem("selectedQuotationForPo");
  }, [moduleCatalog]);

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
      const nextItems = buildQuotationItems(matchedQuotation, moduleCatalog);

      return {
        ...prev,
        sourceQuotationId: normalizeId(
          matchedQuotation.quotationId ?? matchedQuotation.id ?? prev.sourceQuotationId,
        ),
        companyName: matchedQuotation.organizationName || prev.companyName,
        quotationRefNo: matchedQuotation.quotationNo || prev.quotationRefNo || "",
        quotationRefDate: matchedQuotation.date || prev.quotationRefDate || "",
        buyerName: matchedQuotation.quotationToName || prev.buyerName || "",
        buyerAddress:
          matchedQuotation.quotationToAddress || prev.buyerAddress || "",
        supplierName:
          matchedQuotation.organizationName || prev.supplierName || "",
        items: nextItems,
      };
    });
  }, [form.companyName, quotationRecords, moduleCatalog]);

  const totals = useMemo(() => {
    const totalQty = form.items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0),
      0,
    );
    const totalPrice = form.items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0),
      0,
    );
    return { totalQty, totalPrice };
  }, [form.items]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    }));
  };

  const removeItem = (id) => {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length > 1
          ? prev.items.filter((row) => row.id !== id)
          : prev.items,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      quotationId: normalizeId(form.sourceQuotationId),
      companyName: form.companyName,
      poNo:
        form.poNo ||
        `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`,
      poDate: form.poDate || new Date().toISOString().slice(0, 10),
      status: form.status,
      quotationRefNo: form.quotationRefNo,
      quotationRefDate: form.quotationRefDate,
      buyerName: form.buyerName,
      buyerAddress: form.buyerAddress,
      buyerState: form.buyerState,
      buyerStateCode: form.buyerStateCode,
      buyerGSTN: form.buyerGSTN,
      supplierName: form.supplierName,
      supplierAddress: form.supplierAddress,
      supplierState: form.supplierState,
      supplierStateCode: form.supplierStateCode,
      supplierGSTN: form.supplierGSTN,
      deliveryTerms: form.deliveryTerms,
      paymentTerms: form.paymentTerms,
      expectedDeliveryDate: form.expectedDeliveryDate,
      notes: form.notes,
      totalAmount: totals.totalPrice,
      items: form.items.map((item) => ({
        description: item.description,
        qty: Number(item.qty) || 1,
        uom: item.uom || "Nos.",
        rate: Number(item.rate) || 0,
      })),
    };

    try {
      const saved = await createPurchaseOrder(payload);

      sessionStorage.setItem(
        "purchaseOrderData",
        JSON.stringify({
          po: {
            id: saved.id || null,
            quotationId: normalizeId(form.sourceQuotationId),
            companyName: form.companyName,
            poNo: saved.poNo || payload.poNo,
            poDate: form.poDate || payload.poDate,
            status: form.status,
            quotationRefNo: form.quotationRefNo,
            quotationRefDate: form.quotationRefDate,
            buyerName: form.buyerName,
            buyerAddress: form.buyerAddress,
            buyerState: form.buyerState,
            buyerStateCode: form.buyerStateCode,
            buyerGSTN: form.buyerGSTN,
            supplierName: form.supplierName,
            supplierAddress: form.supplierAddress,
            supplierState: form.supplierState,
            supplierStateCode: form.supplierStateCode,
            supplierGSTN: form.supplierGSTN,
            deliveryTerms: form.deliveryTerms,
            paymentTerms: form.paymentTerms,
            expectedDeliveryDate: form.expectedDeliveryDate,
            notes: form.notes,
          },
          items: payload.items,
          totals,
          id: saved.id,
          poNo: saved.poNo || payload.poNo,
          quotationId: normalizeId(form.sourceQuotationId),
        }),
      );

      onNavigate("purchase-order");
    } catch (error) {
      console.error("Failed to save purchase order", error);
      window.alert(
        "Unable to save purchase order to database. Please try again.",
      );
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <form onSubmit={handleSubmit}>
        <div
          className="app-section-title"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: 18,
            paddingBottom: 12,
            gap: 16,
          }}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "#000",
              }}
            >
              Purchase Order Entry
            </h1>
            <span aria-hidden="true" />
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="app-action-btn app-action-btn--secondary"
              onClick={() =>
                onNavigate(
                  sessionStorage.getItem("purchaseOrderBackView") ||
                    defaultReturnView,
                )
              }
            >
              <svg
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
            </button>
            <button
              type="submit"
              className="app-action-btn app-action-btn--primary"
            >
              Save & Open Purchase Order
            </button>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <SearchDropdown
                name="companyName"
                label="Company Name"
                value={form.companyName}
                onChange={(value) => updateField("companyName", value)}
                options={companyOptions}
                placeholder="Select or type company name"
                allowFreeText
                disabled={isQuotationLocked}
              />
            </div>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>PO No.</div>
              <input
                value={form.poNo}
                onChange={(e) => updateField("poNo", e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>PO Date</div>
              <input
                type="date"
                value={form.poDate}
                onChange={(e) => updateField("poDate", e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Status</div>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                style={inputStyle}
              >
                <option value="open">Open</option>
                <option value="partially_fulfilled">Partially fulfilled</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Against Quotation No.
              </div>
              <input
                value={form.quotationRefNo}
                onChange={(e) => updateField("quotationRefNo", e.target.value)}
                style={inputStyle}
                readOnly={isQuotationLocked}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Quotation Date
              </div>
              <input
                type="date"
                value={form.quotationRefDate}
                onChange={(e) =>
                  updateField("quotationRefDate", e.target.value)
                }
                style={inputStyle}
                readOnly={isQuotationLocked}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Expected Delivery
              </div>
              <input
                type="date"
                value={form.expectedDeliveryDate}
                onChange={(e) =>
                  updateField("expectedDeliveryDate", e.target.value)
                }
                style={inputStyle}
              />
            </label>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Buyer / Customer</h3>
              <label>
                Customer Name
                <input
                  value={form.buyerName}
                  onChange={(e) => updateField("buyerName", e.target.value)}
                  style={inputStyle}
                  readOnly={isQuotationLocked}
                />
              </label>
              <label>
                Address
                <input
                  value={form.buyerAddress}
                  onChange={(e) => updateField("buyerAddress", e.target.value)}
                  style={inputStyle}
                  readOnly={isQuotationLocked}
                />
              </label>
              <label>
                State
                <input
                  value={form.buyerState}
                  onChange={(e) => updateField("buyerState", e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label>
                State Code
                <input
                  value={form.buyerStateCode}
                  onChange={(e) =>
                    updateField("buyerStateCode", e.target.value)
                  }
                  style={inputStyle}
                />
              </label>
              <label>
                GSTN No.
                <input
                  value={form.buyerGSTN}
                  onChange={(e) => updateField("buyerGSTN", e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Supplier / Company</h3>
              <label>
                Supplier Name
                <input
                  value={form.supplierName}
                  onChange={(e) => updateField("supplierName", e.target.value)}
                  style={inputStyle}
                  readOnly={isQuotationLocked}
                />
              </label>
              <label>
                Address
                <input
                  value={form.supplierAddress}
                  onChange={(e) =>
                    updateField("supplierAddress", e.target.value)
                  }
                  style={inputStyle}
                />
              </label>
              <label>
                State
                <input
                  value={form.supplierState}
                  onChange={(e) => updateField("supplierState", e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label>
                State Code
                <input
                  value={form.supplierStateCode}
                  onChange={(e) =>
                    updateField("supplierStateCode", e.target.value)
                  }
                  style={inputStyle}
                />
              </label>
              <label>
                GSTN No.
                <input
                  value={form.supplierGSTN}
                  onChange={(e) => updateField("supplierGSTN", e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h3 style={sectionTitleStyle}>Items</h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid #e5e7eb",
                }}
              >
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
                  {form.items.map((item, index) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>
                        <input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          style={inputStyle}
                          readOnly={isItemLocked(item)}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "qty",
                              Number(e.target.value) || 0,
                            )
                          }
                          style={inputStyle}
                          readOnly={isItemLocked(item)}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={item.uom}
                          onChange={(e) =>
                            updateItem(item.id, "uom", e.target.value)
                          }
                          style={inputStyle}
                          readOnly={isItemLocked(item)}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "rate",
                              Number(e.target.value) || 0,
                            )
                          }
                          style={inputStyle}
                          readOnly={isItemLocked(item)}
                        />
                      </td>
                      <td style={tdStyle}>
                        ₹
                        {(
                          (Number(item.qty) || 0) * (Number(item.rate) || 0)
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Delivery Terms
              </div>
              <textarea
                value={form.deliveryTerms}
                onChange={(e) => updateField("deliveryTerms", e.target.value)}
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Payment Terms
              </div>
              <textarea
                value={form.paymentTerms}
                onChange={(e) => updateField("paymentTerms", e.target.value)}
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Notes</div>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              />
            </label>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "flex-end",
              gap: 16,
              fontWeight: 700,
            }}
          >
            <span>Total Qty: {totals.totalQty}</span>
            <span>
              Total Amount: ₹
              {totals.totalPrice.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 13,
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
