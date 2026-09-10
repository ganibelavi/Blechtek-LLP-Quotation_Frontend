import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  fetchModules,
  fetchPurchaseOrderById,
  fetchQuotationById,
  fetchQuotations,
  fetchInvoices,
  fetchNextInvoiceNo,
  fetchPurchaseOrders,
  fetchCompanyProfiles,
  fetchBankAccounts,
  fetchGstRates,
  fetchTermsTemplates,
} from "../../services/quotationApi";
import "../PurchaseOrder/PurchaseOrder.css";
import "./InvoiceEntryForm.css";
import CustomSnackbar from "../../components/CustomSnackbar";

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

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const normalizeQuotationId = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  return String(value).trim();
};

const inputStyle = {
  width: "100%",
  minHeight: 36,
  padding: "7px 10px",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-sm)",
  font: "inherit",
  background: "var(--white)",
  boxSizing: "border-box",
};

const STATUS_LABEL = {
  draft: "Draft",
  advance_received: "Advance Received",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
};

const emptyItem = (
  description = "",
  isSourceData = false,
  rate = 0,
  implementationPrice = 0,
  modulePrice = 0,
) => ({
  id: Date.now() + Math.random(),
  description,
  qty: 1,
  uom: "Nos.",
  rate,
  modulePrice,
  implementationPrice,
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
    module.description ||
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

const getModuleCatalogMatch = (module, moduleCatalog = []) => {
  const name = getModuleName(module).toLowerCase();
  return moduleCatalog.find((catalogItem) => {
    const catalogName = getModuleName(catalogItem).toLowerCase();
    return catalogName === name;
  });
};

const getModuleTaxDetails = (module, moduleCatalog = []) => {
  const details = typeof module === "object" && module ? module : {};
  const catalogMatch = getModuleCatalogMatch(module, moduleCatalog) || {};
  const firstValue = (...values) =>
    values.find(
      (value) =>
        value !== null && value !== undefined && String(value).trim() !== "",
    ) || "";
  const reverseChargeDefault = [
    details.reverseChargeDefault,
    details.ReverseChargeDefault,
    details.reverse_charge_default,
    catalogMatch.reverseChargeDefault,
    catalogMatch.ReverseChargeDefault,
    catalogMatch.reverse_charge_default,
  ].some(
    (value) =>
      value === true ||
      String(value).toLowerCase() === "true" ||
      String(value).toLowerCase() === "yes",
  );
  return {
    hsnCode: firstValue(
      details.hsnCode,
      details.HsnCode,
      details.hsn_code,
      catalogMatch.hsnCode,
      catalogMatch.HsnCode,
      catalogMatch.hsn_code,
    ),
    sacCode: firstValue(
      details.sacCode,
      details.SacCode,
      details.sac_code,
      catalogMatch.sacCode,
      catalogMatch.SacCode,
      catalogMatch.sac_code,
    ),
    reverseChargeDefault,
  };
};

const aggregateModuleTaxDetails = (items = []) => {
  const uniqueValues = (field) =>
    [
      ...new Set(
        items
          .map((item) => item[field])
          .filter(Boolean)
          .map(String),
      ),
    ].join(", ");
  return {
    hsnCode: uniqueValues("hsnCode"),
    sacCode: uniqueValues("sacCode"),
    reverseCharge: items.some((item) => item.reverseChargeDefault)
      ? "Yes"
      : "No",
  };
};

const numberToWords = (value) => {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const underThousand = (number) => {
    if (number < 20) return units[number];
    if (number < 100) {
      return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${units[number % 10]}` : ""}`;
    }
    return ` ${units[Math.floor(number / 100)]} Hundred${number % 100 ? ` ${underThousand(number % 100)}` : ""}`.trim();
  };

  const wholeNumber = Math.floor(Math.max(0, Number(value) || 0));
  if (wholeNumber === 0) return "Rupees Zero Only";

  const groups = [
    { divisor: 10000000, label: "Crore" },
    { divisor: 100000, label: "Lakh" },
    { divisor: 1000, label: "Thousand" },
  ];
  let remaining = wholeNumber;
  const words = [];

  groups.forEach(({ divisor, label }) => {
    const groupValue = Math.floor(remaining / divisor);
    if (groupValue > 0) {
      words.push(`${underThousand(groupValue)} ${label}`);
      remaining %= divisor;
    }
  });
  if (remaining > 0) words.push(underThousand(remaining));

  const paise = Math.round(
    (Math.max(0, Number(value) || 0) - wholeNumber) * 100,
  );
  return `Rupees ${words.join(" ")}${paise ? ` and ${underThousand(paise)} Paise` : ""} Only`;
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
      const modulePrice = Number(
        module?.modulePrice ??
          module?.ModulePrice ??
          getModulePrice(module, moduleCatalog),
      );
      const implementationPrice = Number(
        module?.implementationPrice ?? module?.ImplementationPrice ?? 0,
      );
      const finalPrice = Number(
        module?.finalPrice ??
          module?.FinalPrice ??
          modulePrice + implementationPrice,
      );
      return {
        ...emptyItem(
          name,
          true,
          Number.isFinite(finalPrice) ? finalPrice : 0,
          Number.isFinite(implementationPrice) ? implementationPrice : 0,
          Number.isFinite(modulePrice) ? modulePrice : 0,
        ),
        ...getModuleTaxDetails(module, moduleCatalog),
      };
    })
    .filter(Boolean);
};

const applyQuotationPricing = (items, quotation) => {
  const details = Array.isArray(quotation?.moduleDetails)
    ? quotation.moduleDetails
    : [];

  return items.map((item) => {
    const detail = details.find(
      (module) =>
        getModuleName(module).toLowerCase() ===
        String(item.description || "").trim().toLowerCase(),
    );
    if (!detail) return item;

    const modulePrice = Number(detail.modulePrice ?? detail.ModulePrice ?? 0);
    const implementationPrice = Number(
      detail.implementationPrice ?? detail.ImplementationPrice ?? 0,
    );
    const finalPrice = Number(
      detail.finalPrice ??
        detail.FinalPrice ??
        modulePrice + implementationPrice,
    );

    return {
      ...item,
      modulePrice: Number.isFinite(modulePrice) ? modulePrice : 0,
      implementationPrice: Number.isFinite(implementationPrice)
        ? implementationPrice
        : 0,
      rate:
        Number(item.rate) > 0
          ? Number(item.rate)
          : Number.isFinite(finalPrice)
            ? finalPrice
            : 0,
    };
  });
};

const defaultForm = () => {
  const po = readStoredPurchaseOrder();
  const quotation = readStoredQuotation();
  const poDetails = po?.po || {};
  const itemRows =
    Array.isArray(po?.items) && po.items.length
      ? po.items.map((item) => ({
          id: Date.now() + Math.random() + Math.floor(Math.random() * 1000),
          description: item.description || "",
          qty: Number(item.qty) || 1,
          uom: item.uom || "Nos.",
          rate: Number(item.rate) || 0,
          modulePrice: Number(item.modulePrice) || 0,
          implementationPrice: Number(item.implementationPrice) || 0,
          isSourceData: true,
        }))
      : [emptyItem("", true)];

  return {
    sourceInvoiceId: null,
    sourcePoId: normalizeId(poDetails.id || po?.id || null),
    sourceQuotationId: normalizeQuotationId(
      quotation?.quotationId || po?.quotationId || null,
    ),
    quotationNo: quotation?.quotationNo || po?.quotationNo || "",
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
    poNoDate: poDetails.poNo
      ? `PO No. ${poDetails.poNo} / ${poDetails.poDate || ""}`
      : "",
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

export default function InvoiceEntryForm({
  onNavigate,
  defaultReturnView = "created-invoices",
  initialData,
  viewOnly = false,
}) {
  const [form, setForm] = useState(() => {
    const baseForm = defaultForm();
    const sourceData = initialData?.invoice
      ? initialData
      : { invoice: initialData, items: initialData?.items || [] };
    const sourceItems =
      Array.isArray(sourceData?.items) && sourceData.items.length
        ? sourceData.items.map((item) => ({
            ...item,
            id: item.id || Date.now() + Math.random(),
          }))
        : baseForm.items;
    return {
      ...baseForm,
      ...(sourceData?.invoice || {}),
      status: sourceData?.invoice?.status || sourceData?.status || "draft",
      items: sourceItems,
      sourceInvoiceId: normalizeId(sourceData?.id || sourceData?.invoice?.id),
    };
  });
  const [quotationRecords, setQuotationRecords] = useState([]);
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [invoiceRecords, setInvoiceRecords] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [gstRates, setGstRates] = useState([]);
  const [termsTemplates, setTermsTemplates] = useState([]);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState("");
  const [queueSearch, setQueueSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusActionDialogOpen, setStatusActionDialogOpen] = useState(false);
  const [invoiceForStatusAction, setInvoiceForStatusAction] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const isPreloadedSource = Boolean(form.sourcePoId || form.sourceQuotationId);

  // Fields that are populated from PO/Quotation source data and should be disabled during edit
  const sourceFields = new Set([
    "companyName",
    "supplierName",
    "supplierAddress",
    "supplierState",
    "supplierStateCode",
    "supplierGSTN",
    "receiverName",
    "receiverAddress",
    "receiverState",
    "receiverStateCode",
    "receiverGSTN",
    "consigneeName",
    "consigneeAddress",
    "consigneeState",
    "consigneeStateCode",
    "consigneeGSTN",
    "bankName",
    "accountNo",
    "accountType",
    "ifsc",
    "msmeNo",
    "poNoDate",
    "hsnCode",
    "sacCode",
    "reverseCharge",
    "sgstPct",
    "cgstPct",
    "igstPct",
  ]);

  // Check if a field should be disabled: either viewOnly, or it's a source field and we're editing an existing invoice
  const isFieldDisabled = (fieldName) => {
    if (viewOnly) return true;
    // If editing an existing invoice and field is a source field, disable it
    if (form.sourceInvoiceId && sourceFields.has(fieldName)) return true;
    // If creating new from PO/Quotation, disable source fields
    if (
      !form.sourceInvoiceId &&
      isPreloadedSource &&
      sourceFields.has(fieldName)
    )
      return true;
    return false;
  };

  const isItemLocked = (item) => Boolean(item?.isSourceData);

  useEffect(() => {
    fetchModules()
      .then((data) => setModuleCatalog(Array.isArray(data) ? data : []))
      .catch(() => setModuleCatalog([]));

    fetchQuotations(1, 500)
      .then((data) => setQuotationRecords(Array.isArray(data) ? data : []))
      .catch(() => setQuotationRecords([]));

    fetchInvoices()
      .then((data) => setInvoiceRecords(Array.isArray(data) ? data : []))
      .catch(() => setInvoiceRecords([]));
    fetchPurchaseOrders()
      .then((data) => setPurchaseOrders(Array.isArray(data) ? data : []))
      .catch(() => setPurchaseOrders([]));
    fetchCompanyProfiles()
      .then(setCompanyProfiles)
      .catch(() => setCompanyProfiles([]));
    fetchBankAccounts()
      .then(setBankAccounts)
      .catch(() => setBankAccounts([]));
    fetchGstRates()
      .then(setGstRates)
      .catch(() => setGstRates([]));
    fetchTermsTemplates()
      .then(setTermsTemplates)
      .catch(() => setTermsTemplates([]));
  }, []);

  useEffect(() => {
    if (viewOnly) return;
    if (form.sourceInvoiceId || form.invoiceNo) return;
    fetchNextInvoiceNo()
      .then((invoiceNo) =>
        setForm((prev) => (prev.invoiceNo ? prev : { ...prev, invoiceNo })),
      )
      .catch((error) =>
        console.error("Failed to load next invoice number", error),
      );
  }, [form.sourceInvoiceId, form.invoiceNo, viewOnly]);

  const poQuotationIds = useMemo(
    () =>
      new Set(
        purchaseOrders
          .filter(
            (po) =>
              String(
                po.verificationStatus ??
                  po.VerificationStatus ??
                  po.po?.verificationStatus ??
                  "",
              ).toLowerCase() === "verified",
          )
          .map((po) => po.quotationId ?? po.quotation?.quotationId)
          .filter(Boolean)
          .map(String),
      ),
    [purchaseOrders],
  );

  const generatedPoQuotations = useMemo(
    () =>
      quotationRecords.filter((quotation) =>
        poQuotationIds.has(String(quotation.quotationId ?? quotation.id)),
      ),
    [quotationRecords, poQuotationIds],
  );

  const selectQuotation = async () => {
    const quotation = generatedPoQuotations.find(
      (record) =>
        String(record.quotationId ?? record.id) === String(selectedQuotationId),
    );
    if (!quotation) return;
    const quotationId = String(quotation.quotationId ?? quotation.id);
    const linkedPoSummary = purchaseOrders.find(
      (record) =>
        String(record.quotationId ?? record.po?.quotationId ?? "") ===
          quotationId &&
        String(
          record.verificationStatus ??
            record.VerificationStatus ??
            record.po?.verificationStatus ??
            "",
        ).toLowerCase() === "verified",
    );
    const linkedPoId = normalizeId(
      linkedPoSummary?.id ?? linkedPoSummary?.po?.id,
    );
    const linkedPo = linkedPoId
      ? (await fetchPurchaseOrderById(linkedPoId)) || linkedPoSummary
      : linkedPoSummary;
    const po = linkedPo?.po || linkedPo || {};
    const source = (await fetchQuotationById(quotationId)) || quotation;
    const poItems = Array.isArray(linkedPo?.items || po.items)
      ? (linkedPo?.items || po.items).map((item) => ({
          id: Date.now() + Math.random(),
          description: item.description || "",
          qty: Number(item.qty) || 1,
          uom: item.uom || "Nos.",
          rate: Number(item.rate) || 0,
          modulePrice: Number(item.modulePrice) || 0,
          implementationPrice: Number(item.implementationPrice) || 0,
          isSourceData: true,
          ...getModuleTaxDetails(item, moduleCatalog),
        }))
      : null;
    const selectedItems = applyQuotationPricing(
      poItems || buildQuotationItems(source, moduleCatalog),
      source,
    );
    const moduleTaxDetails = aggregateModuleTaxDetails(selectedItems);
    const profile =
      companyProfiles.find(
        (record) =>
          (record.name || "").toLowerCase() ===
          (source.organizationName || "").toLowerCase(),
      ) || companyProfiles.find((record) => record.isActive);
    const bank =
      bankAccounts.find((record) => record.isDefault) ||
      bankAccounts.find((record) => record.isActive);
    const rate = gstRates.find((record) => record.isActive);
    const saleTerms =
      termsTemplates.find(
        (record) =>
          record.type === "terms_of_sale" &&
          record.isDefault &&
          record.isActive,
      ) ||
      termsTemplates.find(
        (record) => record.type === "terms_of_sale" && record.isActive,
      );
    setForm((prev) => ({
      ...prev,
      sourcePoId: linkedPoId || prev.sourcePoId,
      sourceQuotationId: normalizeQuotationId(source.quotationId ?? source.id),
      quotationNo: source.quotationNo || prev.quotationNo || "",
      companyName:
        po.companyName || source.organizationName || prev.companyName,
      supplierName:
        po.supplierName ||
        profile?.name ||
        source.organizationName ||
        prev.supplierName,
      supplierAddress:
        po.supplierAddress || profile?.address || prev.supplierAddress,
      supplierState: po.supplierState || profile?.state || prev.supplierState,
      supplierStateCode:
        po.supplierStateCode || profile?.stateCode || prev.supplierStateCode,
      supplierGSTN: po.supplierGSTN || profile?.gstn || prev.supplierGSTN,
      bankName: bank?.bankName || prev.bankName,
      accountNo: bank?.accountNo || prev.accountNo,
      accountType: bank?.accountType || prev.accountType,
      ifsc: bank?.ifsc || prev.ifsc,
      msmeNo: bank?.msmeNo || prev.msmeNo,
      sgstPct: rate?.sgstPct ?? prev.sgstPct,
      cgstPct: rate?.cgstPct ?? prev.cgstPct,
      igstPct: rate?.igstPct ?? prev.igstPct,
      hsnCode: moduleTaxDetails.hsnCode,
      sacCode: moduleTaxDetails.sacCode,
      reverseCharge: moduleTaxDetails.reverseCharge,
      termsOfSale: saleTerms?.content || prev.termsOfSale,
      receiverName: po.buyerName || source.quotationToName || prev.receiverName,
      receiverAddress:
        po.buyerAddress || source.quotationToAddress || prev.receiverAddress,
      receiverState: po.buyerState || prev.receiverState,
      receiverStateCode: po.buyerStateCode || prev.receiverStateCode,
      receiverGSTN: po.buyerGSTN || prev.receiverGSTN,
      consigneeName:
        po.buyerName || source.quotationToName || prev.consigneeName,
      consigneeAddress:
        po.buyerAddress || source.quotationToAddress || prev.consigneeAddress,
      consigneeState: po.buyerState || prev.consigneeState,
      consigneeStateCode: po.buyerStateCode || prev.consigneeStateCode,
      consigneeGSTN: po.buyerGSTN || prev.consigneeGSTN,
      poNoDate: po.poNo
        ? `PO No. ${po.poNo} / ${po.poDate || ""}`
        : source.quotationNo
          ? `Quotation No. ${source.quotationNo}`
          : prev.poNoDate,
      items: selectedItems,
    }));
    setShowQuotationModal(false);
  };

  const invoiceQueue = useMemo(
    () =>
      invoiceRecords
        .map((record) => {
          const invoice = record.invoice || record;
          const status = invoice.status || "draft";
          return {
            id: record.id || invoice.id,
            invoice,
            ref: invoice.invoiceNo || `INV-${record.id || invoice.id}`,
            company:
              invoice.companyName || invoice.receiverName || "Unnamed customer",
            date: invoice.dateOfIssue || "Date pending",
            amount: Number(
              record.totals?.grandTotal ??
                invoice.grandTotal ??
                invoice.totalAmount ??
                0,
            ),
            status,
            current:
              normalizeId(form.sourceInvoiceId) ===
              normalizeId(record.id || invoice.id),
          };
        })
        .filter(
          (entry) =>
            `${entry.ref} ${entry.company}`
              .toLowerCase()
              .includes(queueSearch.toLowerCase()) &&
            (statusFilter === "all" || entry.status === statusFilter),
        ),
    [invoiceRecords, queueSearch, form.sourceInvoiceId, statusFilter],
  );

  const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const selectInvoice = (entry) => {
    const invoice = entry.invoice || {};
    const items =
      Array.isArray(invoice.items) && invoice.items.length
        ? invoice.items.map((item) => ({
            id: Date.now() + Math.random(),
            description: item.description || "",
            qty: Number(item.qty) || 1,
            uom: item.uom || "Nos.",
            rate: Number(item.rate) || 0,
            modulePrice: Number(item.modulePrice) || 0,
            implementationPrice: Number(item.implementationPrice) || 0,
            isSourceData: true,
          }))
        : [emptyItem("", true)];
    setForm((prev) => ({
      ...prev,
      sourceInvoiceId: normalizeId(entry.id),
      ...invoice,
      status: entry.status || invoice.status || "draft",
      items,
    }));
  };

  const getInvoiceStatus = () => {
    return form.invoice?.status || form.status || "draft";
  };

  const handleStatusAction = (newStatus) => {
    if (!form.sourceInvoiceId) return;
    setInvoiceForStatusAction({
      id: form.sourceInvoiceId,
      _targetStatus: newStatus,
    });
    setStatusActionDialogOpen(true);
  };

  const handleConfirmStatusAction = async () => {
    if (!invoiceForStatusAction) return;

    try {
      setStatusActionLoading(true);
      const newStatus = invoiceForStatusAction._targetStatus;
      await updateInvoiceStatus(invoiceForStatusAction.id, newStatus);

      // Update local form status
      setForm((prev) => ({ ...prev, status: newStatus }));

      // Update invoice queue
      setInvoiceRecords((prev) =>
        prev.map((record) =>
          record.id === invoiceForStatusAction.id
            ? { ...record, invoice: { ...record.invoice, status: newStatus } }
            : record,
        ),
      );

      setStatusActionDialogOpen(false);
      setInvoiceForStatusAction(null);
      setSnackbar({
        open: true,
        message: `Invoice status updated to ${newStatus}`,
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to update invoice status", err);
      setSnackbar({
        open: true,
        message: "Unable to update invoice status.",
        severity: "error",
      });
      setStatusActionDialogOpen(false);
      setInvoiceForStatusAction(null);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleCloseStatusActionDialog = () => {
    setStatusActionDialogOpen(false);
    setInvoiceForStatusAction(null);
  };

  useEffect(() => {
    if (viewOnly) return;
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
  }, [moduleCatalog, viewOnly]);

  useEffect(() => {
    if (viewOnly) return;
    const rawPo = readStoredPurchaseOrder();
    const rawQuotation = readStoredQuotation();

    const hydrateSourceData = async () => {
      const purchaseOrder = rawPo?.po || rawPo;
      const sourcePoId = normalizeId(purchaseOrder?.id || rawPo?.id || null);
      const sourceQuotationId = normalizeQuotationId(
        rawQuotation?.quotationId ||
          purchaseOrder?.quotationId ||
          rawPo?.quotationId ||
          null,
      );
      if (!sourcePoId && !sourceQuotationId) return;

      try {
        if (sourcePoId) {
          const remotePurchaseOrder = await fetchPurchaseOrderById(sourcePoId);
          if (remotePurchaseOrder) {
            const poPayload = remotePurchaseOrder.po || remotePurchaseOrder;
            const itemRows = Array.isArray(
              remotePurchaseOrder.items || poPayload.items,
            )
              ? (remotePurchaseOrder.items || poPayload.items).map((item) => ({
                  id:
                    Date.now() +
                    Math.random() +
                    Math.floor(Math.random() * 1000),
                  description: item.description || "",
                  qty: Number(item.qty) || 1,
                  uom: item.uom || "Nos.",
                  rate: Number(item.rate) || 0,
                  isSourceData: true,
                }))
              : [emptyItem("", true)];

            setForm((prev) => ({
              ...prev,
              sourcePoId: normalizeId(
                remotePurchaseOrder.id || prev.sourcePoId || null,
              ),
              companyName: poPayload.companyName || prev.companyName || "",
              supplierName: poPayload.supplierName || prev.supplierName || "",
              supplierAddress:
                poPayload.supplierAddress || prev.supplierAddress || "",
              supplierState:
                poPayload.supplierState || prev.supplierState || "",
              supplierStateCode:
                poPayload.supplierStateCode || prev.supplierStateCode || "",
              supplierGSTN: poPayload.supplierGSTN || prev.supplierGSTN || "",
              receiverName: poPayload.buyerName || prev.receiverName || "",
              receiverAddress:
                poPayload.buyerAddress || prev.receiverAddress || "",
              receiverState: poPayload.buyerState || prev.receiverState || "",
              receiverStateCode:
                poPayload.buyerStateCode || prev.receiverStateCode || "",
              receiverGSTN: poPayload.buyerGSTN || prev.receiverGSTN || "",
              consigneeName: poPayload.buyerName || prev.consigneeName || "",
              consigneeAddress:
                poPayload.buyerAddress || prev.consigneeAddress || "",
              consigneeState: poPayload.buyerState || prev.consigneeState || "",
              consigneeStateCode:
                poPayload.buyerStateCode || prev.consigneeStateCode || "",
              consigneeGSTN: poPayload.buyerGSTN || prev.consigneeGSTN || "",
              poNoDate: poPayload.poNo
                ? `PO No. ${poPayload.poNo} / ${poPayload.poDate || ""}`
                : prev.poNoDate || "",
              quotationNo: poPayload.quotationNo || prev.quotationNo || "",
              items: itemRows,
            }));
          }
        }

        if (sourceQuotationId) {
          const remoteQuotation = await fetchQuotationById(sourceQuotationId);
          if (remoteQuotation) {
            setForm((prev) => ({
              ...prev,
              sourceQuotationId: normalizeQuotationId(
                remoteQuotation.quotationId || prev.sourceQuotationId || null,
              ),
              quotationNo:
                remoteQuotation.quotationNo || prev.quotationNo || "",
              companyName:
                remoteQuotation.organizationName || prev.companyName || "",
              supplierName:
                prev.supplierName || remoteQuotation.organizationName || "",
              receiverName:
                prev.receiverName || remoteQuotation.quotationToName || "",
              receiverAddress:
                prev.receiverAddress ||
                remoteQuotation.quotationToAddress ||
                "",
              consigneeName:
                prev.consigneeName || remoteQuotation.quotationToName || "",
              consigneeAddress:
                prev.consigneeAddress ||
                remoteQuotation.quotationToAddress ||
                "",
              poNoDate:
                prev.poNoDate ||
                (remoteQuotation.quotationNo
                  ? `Quotation No. ${remoteQuotation.quotationNo}`
                  : ""),
              items: prev.items.some((item) => item.isSourceData)
                ? applyQuotationPricing(prev.items, remoteQuotation)
                : buildQuotationItems(remoteQuotation, moduleCatalog),
            }));
          }
        }
      } catch (error) {
        console.error("Failed to hydrate invoice source data", error);
      }
    };

    hydrateSourceData();
  }, [moduleCatalog, viewOnly]);

  useEffect(() => {
    if (viewOnly) return;
    const selectedCompanyName = form.companyName?.trim();
    if (!selectedCompanyName) return;

    const matchedQuotation = quotationRecords.find(
      (quotation) =>
        (quotation.organizationName || "").trim().toLowerCase() ===
        selectedCompanyName.toLowerCase(),
    );

    if (!matchedQuotation) return;

    const loadMatchedQuotation = async () => {
      const quotationId = normalizeQuotationId(
        matchedQuotation.quotationId ?? matchedQuotation.id,
      );

      try {
        const remoteQuotation = quotationId
          ? await fetchQuotationById(quotationId)
          : matchedQuotation;

        const activeQuotation = remoteQuotation || matchedQuotation;
        const nextItems = buildQuotationItems(activeQuotation, moduleCatalog);

        setForm((prev) => ({
          ...prev,
          sourceQuotationId: normalizeQuotationId(
            activeQuotation.quotationId ??
              activeQuotation.id ??
              prev.sourceQuotationId,
          ),
          companyName: activeQuotation.organizationName || prev.companyName,
          supplierName:
            activeQuotation.organizationName || prev.supplierName || "",
          receiverName:
            activeQuotation.quotationToName || prev.receiverName || "",
          receiverAddress:
            activeQuotation.quotationToAddress || prev.receiverAddress || "",
          consigneeName:
            activeQuotation.quotationToName || prev.consigneeName || "",
          consigneeAddress:
            activeQuotation.quotationToAddress || prev.consigneeAddress || "",
          quotationNo:
            activeQuotation.quotationNo || prev.quotationNo || "",
          poNoDate: activeQuotation.quotationNo
            ? `Quotation No. ${activeQuotation.quotationNo}`
            : prev.poNoDate || "",
          items: nextItems,
        }));
      } catch (error) {
        console.error(
          "Failed to load quotation for invoice company selection",
          error,
        );
        setForm((prev) => ({
          ...prev,
          sourceQuotationId: normalizeQuotationId(
            matchedQuotation.quotationId ??
              matchedQuotation.id ??
              prev.sourceQuotationId,
          ),
          companyName: matchedQuotation.organizationName || prev.companyName,
          supplierName:
            matchedQuotation.organizationName || prev.supplierName || "",
          receiverName:
            matchedQuotation.quotationToName || prev.receiverName || "",
          receiverAddress:
            matchedQuotation.quotationToAddress || prev.receiverAddress || "",
          consigneeName:
            matchedQuotation.quotationToName || prev.consigneeName || "",
          consigneeAddress:
            matchedQuotation.quotationToAddress || prev.consigneeAddress || "",
          quotationNo:
            matchedQuotation.quotationNo || prev.quotationNo || "",
          poNoDate: matchedQuotation.quotationNo
            ? `Quotation No. ${matchedQuotation.quotationNo}`
            : prev.poNoDate || "",
          items: buildQuotationItems(matchedQuotation, moduleCatalog),
        }));
      }
    };

    loadMatchedQuotation();
  }, [form.companyName, quotationRecords, moduleCatalog, viewOnly]);

  const totals = useMemo(() => {
    const totalQty = form.items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0),
      0,
    );
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
  }, [form]);
  const amountInWords = useMemo(
    () => numberToWords(totals.grandTotal),
    [totals.grandTotal],
  );

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

  const addRow = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeRow = (id) => {
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
    const requiredFields = [
      ["Company name", form.companyName],
      ["Date of issue", form.dateOfIssue],
      ["Supplier name", form.supplierName],
      ["Receiver name", form.receiverName],
    ];
    const missingField = requiredFields.find(
      ([, value]) => !String(value || "").trim(),
    );
    if (
      missingField ||
      form.items.some((item) => !String(item.description || "").trim())
    ) {
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
      poId: normalizeId(form.sourcePoId),
      quotationId: normalizeQuotationId(form.sourceQuotationId),
      quotationNo: form.quotationNo || "",
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
      amountInWords,
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
        hsnCode: item.hsnCode || "",
        sacCode: item.sacCode || "",
        reverseChargeDefault: Boolean(item.reverseChargeDefault),
      })),
    };

    try {
      let saved;
      if (form.sourceInvoiceId) {
        saved = await updateInvoice(form.sourceInvoiceId, payload);
      } else {
        saved = await createInvoice(payload);
      }

      sessionStorage.setItem(
        "invoiceData",
        JSON.stringify({
          invoice: payload,
          items: payload.items,
          totals,
          id: saved.id,
        }),
      );

      onNavigate("invoice");
    } catch (error) {
      console.error("Failed to save invoice", error);
      setSnackbar({
        open: true,
        message: "Unable to save invoice to database. Please try again.",
        severity: "error",
      });
    }
  };

  const handleGenerateInvoice = () => {
    sessionStorage.setItem(
      "invoiceData",
      JSON.stringify({
        invoice: { ...form, amountInWords },
        items: form.items,
        totals,
        id: form.sourceInvoiceId,
      }),
    );
    onNavigate("invoice");
  };

  return (
    <div className="invoice-entry-page po-page">
      <header className="po-topbar">
        <div className="po-brand">
          <span className="po-brand-mark">BT</span>
          <div>
            <strong>BLECHTEK</strong>
            <small>Billing operations</small>
          </div>
        </div>
        <div className="po-topbar-context">
          <span className="po-eyebrow">INVOICE ENTRY</span>
          <strong>GST Invoice Entry</strong>
        </div>
        <div className="po-topbar-actions">
          <button
            type="button"
            className="app-action-btn app-action-btn--secondary"
            onClick={() =>
              onNavigate(
                sessionStorage.getItem("invoiceBackView") || defaultReturnView,
              )
            }
            aria-label="Back to previous page"
            title="Back to previous page"
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
        </div>
      </header>

      <main className="po-workspace invoice-workspace">
        {/* <aside className="po-queue-panel invoice-queue-panel">
          <div className="po-panel-heading">
            <div>
              <span className="po-eyebrow">INBOX</span>
              <h2>Invoice queue</h2>
            </div>
            <span className="po-count">{invoiceQueue.length}</span>
          </div>
          <div className="po-search">
            <span>⌕</span>
            <input
              value={queueSearch}
              onChange={(event) => setQueueSearch(event.target.value)}
              placeholder="Search invoices or customers"
            />
          </div>
          <div className="po-filter-row">
            <button
              type="button"
              className={statusFilter === "all" ? "active" : ""}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={statusFilter === "draft" ? "active" : ""}
              onClick={() => setStatusFilter("draft")}
            >
              Draft
            </button>
            <button
              type="button"
              className={statusFilter === "advance_received" ? "active" : ""}
              onClick={() => setStatusFilter("advance_received")}
            >
              Advance Received
            </button>
            <button
              type="button"
              className={statusFilter === "partially_paid" ? "active" : ""}
              onClick={() => setStatusFilter("partially_paid")}
            >
              Partially Paid
            </button>
            <button
              type="button"
              className={statusFilter === "paid" ? "active" : ""}
              onClick={() => setStatusFilter("paid")}
            >
              Paid
            </button>
            <button
              type="button"
              className={statusFilter === "overdue" ? "active" : ""}
              onClick={() => setStatusFilter("overdue")}
            >
              Overdue
            </button>
          </div>
          <div className="po-queue-list">
            {invoiceQueue.map((entry) => (
              <button
                type="button"
                key={entry.id}
                className={`po-queue-item ${entry.current ? "selected" : ""}`}
                onClick={() => selectInvoice(entry)}
              >
                <div className="po-queue-item-top">
                  <strong>{entry.ref}</strong>
                  <span>{STATUS_LABEL[entry.status] || entry.status}</span>
                </div>
                <div>{entry.company}</div>
                <small>
                  {entry.date} <b>{formatMoney(entry.amount)}</b>
                </small>
              </button>
            ))}
            {!invoiceQueue.length && (
              <div className="po-empty">No matching invoices found.</div>
            )}
          </div>
        </aside> */}

        <section className="po-detail-panel invoice-detail-panel">
          <div className="po-detail-header">
            <div>
              <span className="po-eyebrow">SELECTED RECORD</span>
              <h1>{form.invoiceNo || "New invoice"}</h1>
              <p>
                {form.companyName || "No company selected"} ·{" "}
                {form.dateOfIssue || "Date pending"}
              </p>
            </div>
            <div className="po-detail-actions">
              {!viewOnly && !form.sourceInvoiceId && (
                <button
                  type="button"
                  className="app-action-btn app-action-btn--secondary"
                  onClick={() => {
                    setSelectedQuotationId("");
                    setShowQuotationModal(true);
                  }}
                >
                  New Invoice
                </button>
              )}
              {!viewOnly ? (
                <button
                  type="submit"
                  form="invoice-entry-form"
                  className="app-action-btn app-action-btn--primary"
                >
                  Save
                </button>
              ) : (
                <button
                  type="button"
                  className="app-action-btn app-action-btn--primary"
                  onClick={handleGenerateInvoice}
                >
                  Generate Invoice
                </button>
              )}
              {form.sourceInvoiceId &&
                !viewOnly &&
                getInvoiceStatus() === "draft" && (
                  <button
                    type="button"
                    className="app-action-btn app-action-btn--primary"
                    onClick={() => handleStatusAction("advance_received")}
                  >
                    Mark as Advance Received
                  </button>
                )}
              {form.sourceInvoiceId &&
                !viewOnly &&
                getInvoiceStatus() === "advance_received" && (
                  <>
                    <button
                      type="button"
                      className="app-action-btn app-action-btn--secondary"
                      onClick={() => handleStatusAction("partially_paid")}
                    >
                      Mark as Partially Paid
                    </button>
                    <button
                      type="button"
                      className="app-action-btn app-action-btn--secondary"
                      onClick={() => handleStatusAction("overdue")}
                    >
                      Mark as Overdue
                    </button>
                  </>
                )}
              {form.sourceInvoiceId &&
                !viewOnly &&
                getInvoiceStatus() === "partially_paid" && (
                  <>
                    <button
                      type="button"
                      className="app-action-btn app-action-btn--primary"
                      onClick={() => handleStatusAction("paid")}
                    >
                      Mark as Paid
                    </button>
                    <button
                      type="button"
                      className="app-action-btn app-action-btn--secondary"
                      onClick={() => handleStatusAction("overdue")}
                    >
                      Mark as Overdue
                    </button>
                  </>
                )}
              {form.sourceInvoiceId &&
                !viewOnly &&
                getInvoiceStatus() === "overdue" && (
                  <>
                    <button
                      type="button"
                      className="app-action-btn app-action-btn--secondary"
                      onClick={() => handleStatusAction("partially_paid")}
                    >
                      Mark as Partially Paid
                    </button>
                    <button
                      type="button"
                      className="app-action-btn app-action-btn--primary"
                      onClick={() => handleStatusAction("paid")}
                    >
                      Mark as Paid
                    </button>
                  </>
                )}
              {form.sourceInvoiceId &&
                !viewOnly &&
                getInvoiceStatus() === "paid" && (
                  <button
                    type="button"
                    className="app-action-btn app-action-btn--secondary"
                    onClick={() => handleStatusAction("draft")}
                  >
                    Revert to Draft
                  </button>
                )}
            </div>
          </div>
          <form id="invoice-entry-form" onSubmit={handleSubmit}>
            <section className="po-card">
              <div className="po-card-title">
                <span>01</span>
                <h3>Invoice identity</h3>
              </div>
              <div className="po-fields po-fields-3">
                <label>
                  Company name
                  <input
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    disabled={isFieldDisabled("companyName")}
                    placeholder="Company name from selected quotation"
                  />
                </label>
                <label>
                  Invoice No.
                  <input
                    value={form.invoiceNo}
                    onChange={(e) => updateField("invoiceNo", e.target.value)}
                    readOnly
                  />
                </label>
                <label>
                  Date of Issue <RequiredMark />
                  <input
                    type="date"
                    value={form.dateOfIssue}
                    onChange={(e) => updateField("dateOfIssue", e.target.value)}
                  />
                </label>
                <label>
                  Time of Issue <RequiredMark />
                  <input
                    value={form.timeOfIssue}
                    onChange={(e) => updateField("timeOfIssue", e.target.value)}
                  />
                </label>
                <label>
                  Place of Service <RequiredMark />
                  <input
                    value={form.placeOfService}
                    onChange={(e) =>
                      updateField("placeOfService", e.target.value)
                    }
                  />
                </label>
                <label>
                  PO No. / Date
                  <input
                    value={form.poNoDate}
                    onChange={(e) => updateField("poNoDate", e.target.value)}
                    readOnly={isFieldDisabled("poNoDate")}
                  />
                </label>
                <label>
                  Quotation No.
                  <input
                    value={form.quotationNo || ""}
                    onChange={(e) => updateField("quotationNo", e.target.value)}
                    readOnly
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
                <div className="po-party-block">
                  <h4>Supplier details</h4>
                  <label>
                    Name
                    <input
                      value={form.supplierName}
                      onChange={(e) =>
                        updateField("supplierName", e.target.value)
                      }
                      readOnly={isFieldDisabled("supplierName")}
                    />
                  </label>
                  <label>
                    Address
                    <input
                      value={form.supplierAddress}
                      onChange={(e) =>
                        updateField("supplierAddress", e.target.value)
                      }
                      readOnly={isFieldDisabled("supplierAddress")}
                    />
                  </label>
                  <label>
                    State
                    <input
                      value={form.supplierState}
                      onChange={(e) =>
                        updateField("supplierState", e.target.value)
                      }
                      readOnly={isFieldDisabled("supplierState")}
                    />
                  </label>
                  <label>
                    State code
                    <input
                      value={form.supplierStateCode}
                      onChange={(e) =>
                        updateField("supplierStateCode", e.target.value)
                      }
                      readOnly={isFieldDisabled("supplierStateCode")}
                    />
                  </label>
                  <label>
                    GSTN no.
                    <input
                      value={form.supplierGSTN}
                      onChange={(e) =>
                        updateField("supplierGSTN", e.target.value)
                      }
                      readOnly={isFieldDisabled("supplierGSTN")}
                    />
                  </label>
                </div>
                <div className="po-party-block">
                  <h4>Receiver / Consignee</h4>
                  <label>
                    Name
                    <input
                      value={form.receiverName}
                      onChange={(e) =>
                        updateField("receiverName", e.target.value)
                      }
                      readOnly={isFieldDisabled("receiverName")}
                    />
                  </label>
                  <label>
                    Address
                    <input
                      value={form.receiverAddress}
                      onChange={(e) =>
                        updateField("receiverAddress", e.target.value)
                      }
                      readOnly={isFieldDisabled("receiverAddress")}
                    />
                  </label>
                  <label>
                    State
                    <input
                      value={form.receiverState}
                      onChange={(e) =>
                        updateField("receiverState", e.target.value)
                      }
                      readOnly={isFieldDisabled("receiverState")}
                    />
                  </label>
                  <label>
                    State code
                    <input
                      value={form.receiverStateCode}
                      onChange={(e) =>
                        updateField("receiverStateCode", e.target.value)
                      }
                      readOnly={isFieldDisabled("receiverStateCode")}
                    />
                  </label>
                  <label>
                    GSTN no.
                    <input
                      value={form.receiverGSTN}
                      onChange={(e) =>
                        updateField("receiverGSTN", e.target.value)
                      }
                      readOnly={isFieldDisabled("receiverGSTN")}
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="po-card">
              <div className="po-card-title">
                <span>03</span>
                <h3>Bank details</h3>
              </div>
              <div className="po-fields po-fields-3">
                <label>
                  Bank name / branch
                  <input
                    value={form.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                    readOnly={isFieldDisabled("bankName")}
                  />
                </label>
                <label>
                  Account no.
                  <input
                    value={form.accountNo}
                    onChange={(e) => updateField("accountNo", e.target.value)}
                    readOnly={isFieldDisabled("accountNo")}
                  />
                </label>
                <label>
                  Account type
                  <input
                    value={form.accountType}
                    onChange={(e) => updateField("accountType", e.target.value)}
                    readOnly={isFieldDisabled("accountType")}
                  />
                </label>
                <label>
                  IFSC
                  <input
                    value={form.ifsc}
                    onChange={(e) => updateField("ifsc", e.target.value)}
                    readOnly={isFieldDisabled("ifsc")}
                  />
                </label>
                <label>
                  MSME no.
                  <input
                    value={form.msmeNo}
                    onChange={(e) => updateField("msmeNo", e.target.value)}
                    readOnly={isFieldDisabled("msmeNo")}
                  />
                </label>
              </div>
            </section>

            <section className="po-card">
              <div className="po-card-title">
                <span>04</span>
                <h3>
                  Line items <em>{form.items.length} items</em>
                </h3>
              </div>
              <div className="po-table-wrap">
                <table className="invoice-entry-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>UOM</th>
                      <th>Module price</th>
                      <th>Implementation</th>
                      <th>Total price</th>
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
                              updateItem(item.id, "description", e.target.value)
                            }
                            readOnly={isItemLocked(item)}
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
                            readOnly={isItemLocked(item)}
                          />
                        </td>
                        <td>
                          <input
                            value={item.uom}
                            onChange={(e) =>
                              updateItem(item.id, "uom", e.target.value)
                            }
                            readOnly={isItemLocked(item)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.modulePrice ?? 0}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "modulePrice",
                                Number(e.target.value) || 0,
                              )
                            }
                            readOnly={isItemLocked(item)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.implementationPrice ?? 0}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "implementationPrice",
                                Number(e.target.value) || 0,
                              )
                            }
                            readOnly={isItemLocked(item)}
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
                            readOnly={isItemLocked(item)}
                          />
                        </td>
                        <td className="invoice-entry-amount">
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
              <div className="po-total-row">
                <span>
                  Total quantity <b>{totals.totalQty}</b>
                </span>
                <span>
                  Total amount{" "}
                  <b>
                    ₹
                    {totals.totalPrice.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </b>
                </span>
              </div>
            </section>

            <section className="po-card">
              <div className="po-card-title">
                <span>05</span>
                <h3>Tax details</h3>
              </div>
              <div className="po-fields po-fields-3">
                <label>
                  HSN code
                  <input
                    value={form.hsnCode}
                    onChange={(e) => updateField("hsnCode", e.target.value)}
                    readOnly={isFieldDisabled("hsnCode")}
                  />
                </label>
                <label>
                  SAC code
                  <input
                    value={form.sacCode}
                    onChange={(e) => updateField("sacCode", e.target.value)}
                    readOnly={isFieldDisabled("sacCode")}
                  />
                </label>
                <label>
                  Reverse charge
                  <select
                    value={form.reverseCharge}
                    onChange={(e) =>
                      updateField("reverseCharge", e.target.value)
                    }
                    disabled={isFieldDisabled("reverseCharge")}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </label>
                <label>
                  SGST %
                  <input
                    type="number"
                    step="0.01"
                    value={form.sgstPct}
                    onChange={(e) =>
                      updateField("sgstPct", Number(e.target.value) || 0)
                    }
                    readOnly={isFieldDisabled("sgstPct")}
                  />
                </label>
                <label>
                  CGST %
                  <input
                    type="number"
                    step="0.01"
                    value={form.cgstPct}
                    onChange={(e) =>
                      updateField("cgstPct", Number(e.target.value) || 0)
                    }
                    readOnly={isFieldDisabled("cgstPct")}
                  />
                </label>
                <label>
                  IGST %
                  <input
                    type="number"
                    step="0.01"
                    value={form.igstPct}
                    onChange={(e) =>
                      updateField("igstPct", Number(e.target.value) || 0)
                    }
                    readOnly={isFieldDisabled("igstPct")}
                  />
                </label>
                <label>
                  TDS %
                  <input
                    type="number"
                    step="0.01"
                    value={form.tdsPct}
                    onChange={(e) =>
                      updateField("tdsPct", Number(e.target.value) || 0)
                    }
                  />
                </label>
                <label>
                  Insurance
                  <input
                    type="number"
                    step="0.01"
                    value={form.insurance}
                    onChange={(e) =>
                      updateField("insurance", Number(e.target.value) || 0)
                    }
                  />
                </label>
              </div>
            </section>

            <section className="po-card">
              <div className="po-card-title">
                <span>06</span>
                <h3>Terms & amounts</h3>
              </div>
              <div className="po-fields po-fields-3">
                <label>
                  Terms of sale
                  <textarea
                    value={form.termsOfSale}
                    onChange={(e) => updateField("termsOfSale", e.target.value)}
                    readOnly={isPreloadedSource}
                  />
                </label>
                <label>
                  Amount in words
                  <textarea
                    value={amountInWords}
                    readOnly
                    style={{ minHeight: 90, resize: "vertical" }}
                  />
                </label>
              </div>
            </section>

            <div className="po-total-row invoice-grand-total">
              <span>
                Grand Total{" "}
                <b>
                  ₹
                  {totals.grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </b>
              </span>
            </div>
          </form>
        </section>
      </main>
      <Dialog
        open={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="invoice-quotation-modal-title">
          Select quotation for invoice
        </DialogTitle>
        <DialogContent dividers>
          <p className="invoice-quotation-modal-help">
            Only quotations that already have a purchase order are available.
            Selecting one fills the quotation, company, party, bank, GST, and
            terms data.
          </p>
          <TextField
            select
            fullWidth
            size="small"
            label="PO-generated quotation"
            value={selectedQuotationId}
            onChange={(event) => setSelectedQuotationId(event.target.value)}
          >
            <MenuItem value="">Select quotation...</MenuItem>
            {generatedPoQuotations.map((quotation, index) => (
              <MenuItem
                key={quotation.quotationId ?? quotation.id ?? index}
                value={quotation.quotationId ?? quotation.id}
              >
                {quotation.quotationNo || `Quotation ${index + 1}`} —{" "}
                {quotation.organizationName || "Unassigned company"}
              </MenuItem>
            ))}
          </TextField>
          {!generatedPoQuotations.length && (
            <p className="invoice-quotation-modal-empty">
              No purchase-order-generated quotations are available.
            </p>
          )}
        </DialogContent>
        <DialogActions>
          <button
            type="button"
            className="app-action-btn app-action-btn--secondary"
            onClick={() => setShowQuotationModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="app-action-btn app-action-btn--primary"
            onClick={selectQuotation}
            disabled={!selectedQuotationId}
          >
            Use quotation
          </button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={statusActionDialogOpen}
        onClose={handleCloseStatusActionDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(120deg, #308aea 0%, #48cae4 100%)",
            color: "white",
            fontSize: "18px",
            fontWeight: 600,
            py: 1.5,
          }}
        >
          Confirm Status Change
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            sx={{ mt: 1, fontSize: "14px", lineHeight: 1.5 }}
          >
            Are you sure you want to change the status of{" "}
            <strong>Invoice No. {form.invoiceNo}</strong> to{" "}
            <strong>
              {STATUS_LABEL[invoiceForStatusAction?._targetStatus]}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <button
            type="button"
            className="app-action-btn app-action-btn--secondary"
            onClick={handleCloseStatusActionDialog}
          >
            Cancel
          </button>
          <button
            type="button"
            className="app-action-btn app-action-btn--primary"
            onClick={handleConfirmStatusAction}
            disabled={statusActionLoading}
          >
            {statusActionLoading ? "Updating..." : "Confirm"}
          </button>
        </DialogActions>
      </Dialog>
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
  return (
    <span className="required-mark" aria-label="required">
      *
    </span>
  );
}
