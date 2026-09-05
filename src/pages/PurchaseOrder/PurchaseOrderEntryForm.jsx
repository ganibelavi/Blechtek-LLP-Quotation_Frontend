import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import "./PurchaseOrder.css";
import {
  createPurchaseOrder,
  fetchModules,
  fetchQuotationById,
  fetchQuotations,
  fetchPurchaseOrders,
  fetchPurchaseOrderById,
  fetchCustomers,
  fetchSuppliers,
  updatePurchaseOrderVerification,
} from "../../services/quotationApi";
import {
  dialogPrimaryActionSx,
  dialogSecondaryActionSx,
} from "../../styles/modalActionButtonStyles";
import CustomSnackbar from "../../components/CustomSnackbar";

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

const normalizeQuotationId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
};

const normalizeDateInput = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
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
    const catalogName = (
      catalogItem?.module ??
      catalogItem?.moduleName ??
      catalogItem?.ModuleName ??
      catalogItem?.name ??
      ""
    )
      .trim()
      .toLowerCase();
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
    sourceQuotationId: normalizeQuotationId(quotation?.quotationId),
    companyName: quotation?.organizationName || "",
    poNo: "",
    poDate: new Date().toISOString().slice(0, 10),
    status: "open",
    poDirection: "customer",
    receivedFromEmail: "",
    attachmentUrl: "",
    verificationStatus: "pending",
    verifiedBy: "",
    verifiedAt: "",
    verificationNotes: "",
    uploadedBy: "",
    receivedAt: "",
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
  purchaseOrderId = null,
  defaultReturnView = "created-purchase-orders",
}) {
  const [form, setForm] = useState(defaultForm);
  const [quotationRecords, setQuotationRecords] = useState([]);
  const [purchaseOrderRecords, setPurchaseOrderRecords] = useState([]);
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [customerRecords, setCustomerRecords] = useState([]);
  const [supplierRecords, setSupplierRecords] = useState([]);
  const [selectedQuotationForPo] = useState(readStoredQuotation);
  const [activePurchaseOrderId, setActivePurchaseOrderId] = useState(
    normalizeId(purchaseOrderId),
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const isQuotationLocked = Boolean(form.sourceQuotationId);
  const isItemLocked = (item) => Boolean(item?.isSourceData);

  useEffect(() => {
    const id = normalizeId(purchaseOrderId);
    if (!id) return;

    fetchPurchaseOrderById(id)
      .then((purchaseOrder) => {
        if (!purchaseOrder) return;
        setActivePurchaseOrderId(normalizeId(purchaseOrder.id));
        setForm((prev) => ({
          ...prev,
          sourceQuotationId: normalizeQuotationId(purchaseOrder.quotationId),
          companyName: purchaseOrder.companyName || prev.companyName,
          poNo: purchaseOrder.poNo || prev.poNo,
          poDate: normalizeDateInput(purchaseOrder.poDate) || prev.poDate,
          status: purchaseOrder.status || prev.status,
          poDirection: purchaseOrder.poDirection || prev.poDirection,
          receivedFromEmail: purchaseOrder.receivedFromEmail || "",
          attachmentUrl: purchaseOrder.attachmentUrl || "",
          verificationStatus: purchaseOrder.verificationStatus || "pending",
          verifiedBy: purchaseOrder.verifiedBy || "",
          verifiedAt: normalizeDateInput(purchaseOrder.verifiedAt),
          verificationNotes: purchaseOrder.verificationNotes || "",
          uploadedBy: purchaseOrder.uploadedBy || "",
          receivedAt: normalizeDateInput(purchaseOrder.receivedAt),
          quotationRefNo: purchaseOrder.quotationRefNo || "",
          quotationRefDate: normalizeDateInput(purchaseOrder.quotationRefDate),
          buyerName: purchaseOrder.buyerName || "",
          buyerAddress: purchaseOrder.buyerAddress || "",
          buyerState: purchaseOrder.buyerState || "",
          buyerStateCode: purchaseOrder.buyerStateCode || "",
          buyerGSTN: purchaseOrder.buyerGSTN || "",
          supplierName: purchaseOrder.supplierName || "",
          supplierAddress: purchaseOrder.supplierAddress || "",
          supplierState: purchaseOrder.supplierState || "",
          supplierStateCode: purchaseOrder.supplierStateCode || "",
          supplierGSTN: purchaseOrder.supplierGSTN || "",
          deliveryTerms: purchaseOrder.deliveryTerms || "",
          paymentTerms: purchaseOrder.paymentTerms || "",
          items:
            Array.isArray(purchaseOrder.items) && purchaseOrder.items.length > 0
              ? purchaseOrder.items.map((item) => ({
                  ...item,
                  isSourceData: true,
                }))
              : prev.items,
        }));
      })
      .catch((error) => {
        console.error("Failed to load purchase order by id", error);
        setSnackbar({
          open: true,
          message: "Unable to load the selected purchase order.",
          severity: "error",
        });
      });
  }, [purchaseOrderId]);

  useEffect(() => {
    fetchModules()
      .then((data) => setModuleCatalog(Array.isArray(data) ? data : []))
      .catch(() => setModuleCatalog([]));

    fetchQuotations(1, 500)
      .then((data) => setQuotationRecords(Array.isArray(data) ? data : []))
      .catch(() => setQuotationRecords([]));

    fetchCustomers()
      .then((data) => setCustomerRecords(Array.isArray(data) ? data : []))
      .catch(() => setCustomerRecords([]));

    fetchSuppliers()
      .then((data) => setSupplierRecords(Array.isArray(data) ? data : []))
      .catch(() => setSupplierRecords([]));

    fetchPurchaseOrders()
      .then((data) => setPurchaseOrderRecords(Array.isArray(data) ? data : []))
      .catch(() => setPurchaseOrderRecords([]));
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
    const selectedQuotation = selectedQuotationForPo;

    if (!selectedQuotation) return;

    const hydrateFromQuotation = (quotation) => {
      const quotationOrganization = quotation.organizationName || "";
      const quotationCustomerName = quotation.quotationToName || "";
      const customer = customerRecords.find((record) => {
        const contactName = (record.contactName || "").trim().toLowerCase();
        const customerName = (record.name || "").trim().toLowerCase();
        const selectedName = quotationCustomerName.trim().toLowerCase();
        return (
          selectedName &&
          (contactName === selectedName || customerName === selectedName)
        );
      });
      const supplier =
        supplierRecords.find(
          (record) =>
            (record.name || "").trim().toLowerCase() ===
            quotationOrganization.trim().toLowerCase(),
        ) || supplierRecords[0];

      setForm((prev) => ({
        ...prev,
        sourceQuotationId: normalizeQuotationId(
          quotation.quotationId || prev.sourceQuotationId || null,
        ),
        companyName: quotationOrganization || prev.companyName || "",
        quotationRefNo: quotation.quotationNo || prev.quotationRefNo || "",
        quotationRefDate: quotation.date || prev.quotationRefDate || "",
        buyerName:
          customer?.contactName ||
          customer?.name ||
          quotationCustomerName ||
          prev.buyerName ||
          "",
        buyerAddress:
          customer?.address ||
          quotation.quotationToAddress ||
          prev.buyerAddress ||
          "",
        buyerState: customer?.state || prev.buyerState || "",
        buyerStateCode: customer?.stateCode || prev.buyerStateCode || "",
        buyerGSTN: customer?.gstn || prev.buyerGSTN || "",
        supplierName:
          supplier?.name || quotationOrganization || prev.supplierName || "",
        supplierAddress: supplier?.address || prev.supplierAddress || "",
        supplierState: supplier?.state || prev.supplierState || "",
        supplierStateCode: supplier?.stateCode || prev.supplierStateCode || "",
        supplierGSTN: supplier?.gstn || prev.supplierGSTN || "",
        items: buildQuotationItems(quotation, moduleCatalog),
      }));
    };

    const hydrateFromStored = async () => {
      const quotationIdentifier =
        selectedQuotation.quotationId ?? selectedQuotation.id;
      if (quotationIdentifier) {
        try {
          const remoteQuotation = await fetchQuotationById(quotationIdentifier);
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
  }, [moduleCatalog, customerRecords, supplierRecords, selectedQuotationForPo]);

  useEffect(() => {
    if (!form.sourceQuotationId) return;

    setForm((prev) => {
      const customerName = (prev.buyerName || "").trim().toLowerCase();
      const supplierName = (prev.supplierName || "").trim().toLowerCase();
      const customer = customerRecords.find(
        (record) =>
          (record.contactName || "").trim().toLowerCase() === customerName ||
          (record.name || "").trim().toLowerCase() === customerName,
      );
      const supplier =
        supplierRecords.find(
          (record) => (record.name || "").trim().toLowerCase() === supplierName,
        ) || supplierRecords[0];

      if (!customer && !supplier) return prev;

      return {
        ...prev,
        ...(customer
          ? {
              buyerName:
                customer.contactName || customer.name || prev.buyerName,
              buyerAddress: customer.address || prev.buyerAddress,
              buyerState: customer.state || prev.buyerState,
              buyerStateCode: customer.stateCode || prev.buyerStateCode,
              buyerGSTN: customer.gstn || prev.buyerGSTN,
            }
          : {}),
        ...(supplier
          ? {
              supplierName: supplier.name || prev.supplierName,
              supplierAddress: supplier.address || prev.supplierAddress,
              supplierState: supplier.state || prev.supplierState,
              supplierStateCode: supplier.stateCode || prev.supplierStateCode,
              supplierGSTN: supplier.gstn || prev.supplierGSTN,
            }
          : {}),
      };
    });
  }, [form.sourceQuotationId, customerRecords, supplierRecords]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const requiredFields = [
      ["Company name", form.companyName],
      ["PO number", form.poNo || "generated"],
      ["PO date", form.poDate],
      ["Buyer name", form.buyerName],
      ["Supplier name", form.supplierName],
    ];
    const missingField = requiredFields.find(([, value]) => !String(value || "").trim());
    if (missingField || form.items.some((item) => !String(item.description || "").trim())) {
      setSnackbar({
        open: true,
        message: missingField
          ? `${missingField[0]} is required.`
          : "Each item must have a description.",
        severity: "warning",
      });
      return;
    }

    const payload = {
      quotationId: form.sourceQuotationId,
      companyName: form.companyName,
      poNo:
        form.poNo ||
        `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`,
      poDate: form.poDate || new Date().toISOString().slice(0, 10),
      status: form.status,
      poDirection: form.poDirection,
      receivedFromEmail: form.receivedFromEmail,
      attachmentUrl: form.attachmentUrl,
      verificationStatus: form.verificationStatus,
      verifiedBy: form.verifiedBy,
      verifiedAt: form.verifiedAt,
      verificationNotes: form.verificationNotes,
      uploadedBy: form.uploadedBy,
      receivedAt: form.receivedAt,
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
      setActivePurchaseOrderId(normalizeId(saved.id));

      sessionStorage.setItem(
        "purchaseOrderData",
        JSON.stringify({
          po: {
            id: saved.id || null,
            quotationId: form.sourceQuotationId,
            companyName: form.companyName,
            poNo: saved.poNo || payload.poNo,
            poDate: form.poDate || payload.poDate,
            status: form.status,
            poDirection: form.poDirection,
            receivedFromEmail: form.receivedFromEmail,
            attachmentUrl: form.attachmentUrl,
            verificationStatus: form.verificationStatus,
            verifiedBy: form.verifiedBy,
            verifiedAt: form.verifiedAt,
            verificationNotes: form.verificationNotes,
            uploadedBy: form.uploadedBy,
            receivedAt: form.receivedAt,
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
          quotationId: form.sourceQuotationId,
        }),
      );

      setSnackbar({
        open: true,
        message: "Purchase order saved successfully.",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to save purchase order", error);
      setSnackbar({
        open: true,
        message: "Unable to save purchase order to database. Please try again.",
        severity: "error",
      });
    }
  };

  const queue = useMemo(() => {
    const current = {
      id: "current-entry",
      ref: form.poNo || "New purchase order",
      company: form.companyName || "Select a company",
      date: form.poDate || "—",
      amount: totals.totalPrice,
      source: null,
      current: true,
      verificationStatus: form.verificationStatus || "pending",
    };
    const savedOrders = purchaseOrderRecords.map((purchaseOrder) => ({
      id: purchaseOrder.id,
      ref: purchaseOrder.poNo || `PO-${purchaseOrder.id}`,
      company:
        purchaseOrder.companyName ||
        purchaseOrder.buyerName ||
        purchaseOrder.supplierName ||
        "Unassigned company",
      date: purchaseOrder.poDate || "—",
      amount: Number(purchaseOrder.totalAmount || 0),
      source: purchaseOrder,
      verificationStatus: (
        purchaseOrder.verificationStatus || "pending"
      ).toLowerCase(),
    }));
    return [current, ...savedOrders];
  }, [
    purchaseOrderRecords,
    form.poNo,
    form.companyName,
    form.poDate,
    form.verificationStatus,
    totals.totalPrice,
  ]);

  const [queueSearch, setQueueSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    quotationId: "",
    poNo: "",
    poDate: "",
    receivedFromEmail: "",
    attachmentUrl: "",
  });
  const filteredQueue = queue.filter((entry) => {
    const haystack = `${entry.ref} ${entry.company}`.toLowerCase();
    return (
      haystack.includes(queueSearch.toLowerCase()) &&
      (queueFilter === "all" || entry.verificationStatus === queueFilter)
    );
  });
  const selectQueueEntry = (entry) => {
    if (entry.current || !entry.source) return;
    const purchaseOrder = entry.source;
    setActivePurchaseOrderId(normalizeId(purchaseOrder.id));
    const customerName = (
      purchaseOrder.quotationToName ||
      purchaseOrder.buyerName ||
      ""
    )
      .trim()
      .toLowerCase();
    const customer = customerRecords.find(
      (record) =>
        (record.contactName || "").trim().toLowerCase() === customerName ||
        (record.name || "").trim().toLowerCase() === customerName,
    );
    const organizationName = (
      purchaseOrder.organizationName ||
      purchaseOrder.companyName ||
      ""
    )
      .trim()
      .toLowerCase();
    const supplier =
      supplierRecords.find(
        (record) =>
          (record.name || "").trim().toLowerCase() === organizationName,
      ) || supplierRecords[0];

    setForm((prev) => ({
      ...prev,
      sourceQuotationId: normalizeQuotationId(purchaseOrder.quotationId),
      companyName:
        purchaseOrder.companyName ||
        purchaseOrder.organizationName ||
        prev.companyName,
      poNo: purchaseOrder.poNo || prev.poNo,
      poDate: purchaseOrder.poDate || prev.poDate,
      status: purchaseOrder.status || prev.status,
      verificationStatus: purchaseOrder.verificationStatus || "pending",
      quotationRefNo:
        purchaseOrder.quotationRefNo ||
        purchaseOrder.quotationNo ||
        prev.quotationRefNo,
      quotationRefDate:
        purchaseOrder.quotationRefDate ||
        purchaseOrder.date ||
        prev.quotationRefDate,
      buyerName:
        customer?.contactName ||
        customer?.name ||
        purchaseOrder.buyerName ||
        purchaseOrder.quotationToName ||
        prev.buyerName,
      buyerAddress:
        customer?.address ||
        purchaseOrder.buyerAddress ||
        purchaseOrder.quotationToAddress ||
        prev.buyerAddress,
      buyerState:
        customer?.state || purchaseOrder.buyerState || prev.buyerState,
      buyerStateCode:
        customer?.stateCode ||
        purchaseOrder.buyerStateCode ||
        prev.buyerStateCode,
      buyerGSTN: customer?.gstn || purchaseOrder.buyerGSTN || prev.buyerGSTN,
      supplierName:
        supplier?.name || purchaseOrder.supplierName || prev.supplierName,
      supplierAddress:
        supplier?.address ||
        purchaseOrder.supplierAddress ||
        prev.supplierAddress,
      supplierState:
        supplier?.state || purchaseOrder.supplierState || prev.supplierState,
      supplierStateCode:
        supplier?.stateCode ||
        purchaseOrder.supplierStateCode ||
        prev.supplierStateCode,
      supplierGSTN:
        supplier?.gstn || purchaseOrder.supplierGSTN || prev.supplierGSTN,
      deliveryTerms: purchaseOrder.deliveryTerms || prev.deliveryTerms,
      paymentTerms: purchaseOrder.paymentTerms || prev.paymentTerms,
      receivedFromEmail:
        purchaseOrder.receivedFromEmail || prev.receivedFromEmail,
      attachmentUrl: purchaseOrder.attachmentUrl || prev.attachmentUrl,
      items:
        Array.isArray(purchaseOrder.items) && purchaseOrder.items.length > 0
          ? purchaseOrder.items.map((item) => ({ ...item, isSourceData: true }))
          : buildQuotationItems(purchaseOrder, moduleCatalog),
    }));
  };

  const updateVerificationStatus = async (status) => {
    if (!activePurchaseOrderId) {
      setSnackbar({
        open: true,
        message: "Save the purchase order before updating its verification status.",
        severity: "warning",
      });
      return;
    }

    try {
      const result = await updatePurchaseOrderVerification(
        activePurchaseOrderId,
        {
          verificationStatus: status,
          verificationNotes: form.verificationNotes,
        },
      );
      setForm((prev) => ({
        ...prev,
        verificationStatus: result.verificationStatus,
        verificationNotes: result.verificationNotes || "",
        verifiedAt: result.verifiedAt || "",
      }));
      setPurchaseOrderRecords((records) =>
        records.map((record) =>
          normalizeId(record.id) === activePurchaseOrderId
            ? {
                ...record,
                verificationStatus: result.verificationStatus,
                verificationNotes: result.verificationNotes || "",
                verifiedAt: result.verifiedAt || "",
              }
            : record,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to update purchase order verification status",
        error,
      );
      setSnackbar({
        open: true,
        message: "Unable to update the purchase order verification status.",
        severity: "error",
      });
    }
  };

  const updateIntakeField = (field, value) => {
    setIntakeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmailPoIntake = async (event) => {
    event.preventDefault();
    const quotationIdentifier = intakeForm.quotationId;
    const quotationRecord = quotationRecords.find(
      (record) =>
        String(record.quotationId ?? record.id) === String(quotationIdentifier),
    );
    let quotation = quotationRecord;

    if (quotationIdentifier) {
      try {
        quotation =
          (await fetchQuotationById(quotationIdentifier)) || quotationRecord;
      } catch (error) {
        console.error("Failed to load selected quotation for PO", error);
      }
    }

    if (quotation) {
      selectQueueEntry({
        current: false,
        source: quotation,
      });
    }

    setForm((prev) => ({
      ...prev,
      poNo: intakeForm.poNo || prev.poNo,
      poDate: intakeForm.poDate || prev.poDate,
      poDirection: "customer",
      receivedFromEmail: intakeForm.receivedFromEmail,
      attachmentUrl: intakeForm.attachmentUrl,
      verificationStatus: "pending",
      receivedAt: new Date().toISOString(),
    }));
    setShowUpload(false);
  };

  const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const statusLabel = form.status.replace(/_/g, " ");

  return (
    <div className="po-page po-verification-page">
      <header className="po-topbar">
        <div className="po-brand">
          <span className="po-brand-mark">BT</span>
          <div>
            <strong>BLECHTEK</strong>
            <small>Purchase operations</small>
          </div>
        </div>
        <div className="po-topbar-context">
          <span className="po-eyebrow">PURCHASE ORDER CONTROL</span>
          <strong>PO verification workspace</strong>
        </div>
        <div className="po-topbar-actions">
          <span className={`po-status-pill po-status-${form.status}`}>
            {statusLabel}
          </span>
          <button
            type="button"
            className="app-action-btn app-action-btn--secondary"
            title="Back"
            aria-label="Back"
            onClick={() =>
              onNavigate(
                sessionStorage.getItem("purchaseOrderBackView") ||
                  defaultReturnView,
              )
            }
          >
            ←
          </button>
        </div>
      </header>

      <main className="po-workspace">
        <aside className="po-queue-panel">
          <div className="po-panel-heading">
            <div>
              <span className="po-eyebrow">INBOX</span>
              <h2>PO queue</h2>
            </div>
            <span className="po-count">{filteredQueue.length}</span>
          </div>
          <div className="po-search">
            <span>⌕</span>
            <input
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              placeholder="Search POs or companies"
            />
          </div>
          <div className="po-filter-row">
            <button
              type="button"
              className={queueFilter === "all" ? "active" : ""}
              onClick={() => setQueueFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={queueFilter === "pending" ? "active" : ""}
              onClick={() => setQueueFilter("pending")}
            >
              Pending
            </button>
            <button
              type="button"
              className={queueFilter === "verified" ? "active" : ""}
              onClick={() => setQueueFilter("verified")}
            >
              Verified
            </button>
            <button
              type="button"
              className={queueFilter === "mismatch" ? "active" : ""}
              onClick={() => setQueueFilter("mismatch")}
            >
              Mismatch
            </button>
            <button
              type="button"
              className={queueFilter === "rejected" ? "active" : ""}
              onClick={() => setQueueFilter("rejected")}
            >
              Rejected
            </button>
          </div>
          <div className="po-queue-list">
            {filteredQueue.map((entry) => (
              <button
                type="button"
                key={entry.id}
                className={`po-queue-item ${entry.current ? "selected" : ""}`}
                onClick={() => selectQueueEntry(entry)}
              >
                <div className="po-queue-item-top">
                  <strong>{entry.ref}</strong>
                  <span>{entry.verificationStatus.toUpperCase()}</span>
                </div>
                <div>{entry.company}</div>
                <small>
                  {entry.date} <b>{formatMoney(entry.amount)}</b>
                </small>
              </button>
            ))}
            {!filteredQueue.length && (
              <div className="po-empty">
                No matching purchase orders or quotations.
              </div>
            )}
          </div>
        </aside>

        <section className="po-detail-panel">
          <div className="po-detail-header">
            <div>
              <span className="po-eyebrow">SELECTED RECORD</span>
              <h1>{form.poNo || "New purchase order"}</h1>
              <p>
                {form.companyName || "No company selected"} ·{" "}
                {form.poDate || "Date pending"}
              </p>
            </div>
            <div className="po-detail-actions">
              <button
                type="button"
                className="app-action-btn app-action-btn--secondary"
                onClick={() => setShowUpload(true)}
              >
                New PO
              </button>
              <button
                type="submit"
                form="po-entry-form"
                className="app-action-btn app-action-btn--primary"
              >
                Save
              </button>
              {activePurchaseOrderId &&
                form.verificationStatus === "pending" && (
                  <>
                    <button
                      type="button"
                      className="app-action-btn app-action-btn--primary"
                      onClick={() => updateVerificationStatus("verified")}
                    >
                      Verify & allow Invoicing
                    </button>
                    <button
                      type="button"
                      className="app-action-btn app-action-btn--secondary"
                      onClick={() => updateVerificationStatus("mismatch")}
                    >
                      Flag Mismatch
                    </button>
                    <button
                      type="button"
                      className="app-action-btn app-action-btn--secondary"
                      onClick={() => updateVerificationStatus("rejected")}
                    >
                      Reject PO
                    </button>
                  </>
                )}
              {activePurchaseOrderId &&
                form.verificationStatus !== "pending" && (
                  <button
                    type="button"
                    className="app-action-btn app-action-btn--secondary"
                    onClick={() => updateVerificationStatus("pending")}
                  >
                    Move to pending
                  </button>
                )}
            </div>
          </div>
          <div className="po-verification-grid">
            <div className="po-form-column">
              <form id="po-entry-form" onSubmit={handleSubmit}>
                <section className="po-card">
                  <div className="po-card-title">
                    <span>01</span>
                    <h3>Order identity</h3>
                  </div>
                  <div className="po-fields po-fields-3">
                    <label>
                      Company name <RequiredMark />
                      <input value={form.companyName} readOnly />
                    </label>
                    <label>
                      PO number <RequiredMark />
                      <input
                        value={form.poNo}
                        onChange={(e) => updateField("poNo", e.target.value)}
                      />
                    </label>
                    <label>
                      PO date <RequiredMark />
                      <input
                        type="date"
                        value={form.poDate}
                        onChange={(e) => updateField("poDate", e.target.value)}
                      />
                    </label>
                    <label>
                      Status
                      <select
                        className={`po-status-select po-status-${form.status}`}
                        value={form.status}
                        onChange={(e) => updateField("status", e.target.value)}
                      >
                        <option value="open">Open</option>
                        <option value="partially_fulfilled">
                          Partially fulfilled
                        </option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>
                    <label>
                      Quotation reference
                      <input
                        value={form.quotationRefNo}
                        onChange={(e) =>
                          updateField("quotationRefNo", e.target.value)
                        }
                        disabled={isQuotationLocked}
                      />
                    </label>
                    <label>
                      Quotation date
                      <input
                        type="date"
                        value={form.quotationRefDate}
                        onChange={(e) =>
                          updateField("quotationRefDate", e.target.value)
                        }
                        disabled={isQuotationLocked}
                      />
                    </label>
                    <label>
                      Expected delivery
                      <input
                        type="date"
                        value={form.expectedDeliveryDate}
                        onChange={(e) =>
                          updateField("expectedDeliveryDate", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </section>
                <section className="po-card">
                  <div className="po-card-title">
                    <span>02</span>
                    <h3>Parties</h3>
                  </div>
                  <div className="po-party-grid">
                    <PartyBlock
                      title="Buyer / customer"
                      fields={[
                        ["Customer name", "buyerName", true],
                        ["Address", "buyerAddress"],
                        ["State", "buyerState"],
                        ["State code", "buyerStateCode"],
                        ["GSTN no.", "buyerGSTN"],
                      ]}
                      form={form}
                      updateField={updateField}
                      locked={isQuotationLocked}
                    />
                    <PartyBlock
                      title="Supplier / company"
                      fields={[
                        ["Supplier name", "supplierName", true],
                        ["Address", "supplierAddress"],
                        ["State", "supplierState"],
                        ["State code", "supplierStateCode"],
                        ["GSTN no.", "supplierGSTN"],
                      ]}
                      form={form}
                      updateField={updateField}
                      locked={isQuotationLocked}
                    />
                  </div>
                </section>
                <section className="po-card">
                  <div className="po-card-title">
                    <span>03</span>
                    <h3>Line items</h3>
                    <em>{form.items.length} items</em>
                  </div>
                  <div className="po-table-wrap">
                    <table className="po-table">
                      <thead>
                        <tr>
                          <th>Description <RequiredMark /></th>
                          <th>Qty</th>
                          <th>UOM</th>
                          <th>Rate</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <input
                                value={item.description}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                disabled={isItemLocked(item)}
                                required={!isItemLocked(item)}
                              />
                            </td>
                            <td>
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
                                disabled={isItemLocked(item)}
                              />
                            </td>
                            <td>
                              <input
                                value={item.uom}
                                onChange={(e) =>
                                  updateItem(item.id, "uom", e.target.value)
                                }
                                disabled={isItemLocked(item)}
                              />
                            </td>
                            <td>
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
                                disabled={isItemLocked(item)}
                              />
                            </td>
                            <td className="po-amount">
                              {formatMoney(
                                (Number(item.qty) || 0) *
                                  (Number(item.rate) || 0),
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="po-total-row">
                    <span>
                      Total quantity <b>{totals.totalQty}</b>
                    </span>
                    <span>
                      Total amount <b>{formatMoney(totals.totalPrice)}</b>
                    </span>
                  </div>
                </section>
                <section className="po-card">
                  <div className="po-card-title">
                    <span>04</span>
                    <h3>Terms &amp; notes</h3>
                  </div>
                  <div className="po-fields po-fields-3">
                    <label>
                      Delivery terms
                      <textarea
                        value={form.deliveryTerms}
                        onChange={(e) =>
                          updateField("deliveryTerms", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Payment terms
                      <textarea
                        value={form.paymentTerms}
                        onChange={(e) =>
                          updateField("paymentTerms", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Notes
                      <textarea
                        value={form.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                      />
                    </label>
                  </div>
                </section>
              </form>
            </div>
            {/* Temporarily hidden quotation comparison panel. */}
            {/*
            <aside className="po-comparison"><div className="po-comparison-head"><span className="po-eyebrow">SOURCE CHECK</span><h2>Quotation comparison</h2><p>Review source data before saving this order.</p></div><div className="po-check-row"><span>Quotation linked</span><strong className={form.sourceQuotationId ? "good" : "pending"}>{form.sourceQuotationId ? "MATCHED" : "MANUAL ENTRY"}</strong></div><CompareRow label="Company" value={form.companyName} /><CompareRow label="Reference" value={form.quotationRefNo || "Not provided"} /><CompareRow label="Buyer" value={form.buyerName || "Not provided"} /><CompareRow label="Line items" value={`${form.items.length} item${form.items.length === 1 ? "" : "s"}`} /><div className="po-compare-total"><span>Order value</span><strong>{formatMoney(totals.totalPrice)}</strong></div><div className="po-audit"><span className="po-eyebrow">WORKFLOW NOTE</span><p>Fields hydrated from the selected quotation remain locked. Manual details can be completed before submission.</p></div></aside>
            */}
          </div>
        </section>
      </main>
      {showUpload && (
        <Dialog
          open
          onClose={() => setShowUpload(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle
            sx={{
              background: "var(--primary-gradient)",
              color: "white",
              fontSize: "18px",
              fontWeight: 600,
              py: 1.5,
            }}
          >
            ✉&nbsp; Log a PO received by email
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Box
              component="p"
              sx={{
                color: "text.secondary",
                fontSize: "13px",
                lineHeight: 1.5,
                mb: 2,
              }}
            >
              Attach the client's PO exactly as received. Fields below are
              entered by your team, not generated.
            </Box>
            <form id="po-intake-form" onSubmit={handleEmailPoIntake}>
              <Box sx={{ display: "grid", gap: 1.75 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Link to quotation"
                  value={intakeForm.quotationId}
                  onChange={(e) =>
                    updateIntakeField("quotationId", e.target.value)
                  }
                >
                  <MenuItem value="">Select quotation...</MenuItem>
                  {quotationRecords.map((quotation, index) => (
                    <MenuItem
                      key={quotation.quotationId ?? quotation.id ?? index}
                      value={quotation.quotationId ?? quotation.id}
                    >
                      {quotation.quotationNo || `Quotation ${index + 1}`} —{" "}
                      {quotation.organizationName || "Unassigned company"}
                    </MenuItem>
                  ))}
                </TextField>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1.75,
                  }}
                >
                  <TextField
                    size="small"
                    label="PO number"
                    value={intakeForm.poNo}
                    onChange={(e) => updateIntakeField("poNo", e.target.value)}
                    placeholder="e.g. XYZ/PO/2026/04"
                  />
                  <TextField
                    size="small"
                    label="PO date"
                    type="date"
                    value={intakeForm.poDate}
                    onChange={(e) =>
                      updateIntakeField("poDate", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <TextField
                  size="small"
                  label="Received from (email)"
                  type="email"
                  value={intakeForm.receivedFromEmail}
                  onChange={(e) =>
                    updateIntakeField("receivedFromEmail", e.target.value)
                  }
                  placeholder="procurement@client.com"
                />
                <Box>
                  <Box
                    sx={{ color: "text.secondary", fontSize: "13px", mb: 0.75 }}
                  >
                    Attachment
                  </Box>
                  <Box
                    component="label"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      minHeight: 40,
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 1.5,
                      color: "text.secondary",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    📎{" "}
                    {intakeForm.attachmentUrl ||
                      "Choose the PO file from the email..."}
                    <input
                      hidden
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) =>
                        updateIntakeField(
                          "attachmentUrl",
                          e.target.files?.[0]?.name || "",
                        )
                      }
                    />
                  </Box>
                </Box>
              </Box>
            </form>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button
              onClick={() => setShowUpload(false)}
              sx={dialogSecondaryActionSx}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="po-intake-form"
              variant="contained"
              sx={dialogPrimaryActionSx}
            >
              Add to review queue
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
    </div>
  );
}

function RequiredMark() {
  return <span className="required-mark" aria-label="required">*</span>;
}

function PartyBlock({ title, fields, form, updateField, locked }) {
  return (
    <div className="po-party-block">
      <h4>{title}</h4>
      {fields.map(([label, field, required]) => (
        <label key={field}>
          {label} {required && <RequiredMark />}
          <input
            value={form[field]}
            onChange={(e) => updateField(field, e.target.value)}
            disabled={locked}
          />
        </label>
      ))}
    </div>
  );
}

// Temporarily disabled with the quotation comparison panel.
// function CompareRow({ label, value }) { return <div className="po-compare-row"><span>{label}</span><strong>{value}</strong></div>; }
