import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import SearchDropdown from "../../components/SearchDropdown";
import {
  createInvoice,
  fetchModules,
  fetchPurchaseOrderById,
  fetchPurchaseOrderCompanies,
  fetchQuotationById,
  fetchQuotations,
  fetchInvoices,
  fetchPurchaseOrders,
  fetchCompanyProfiles,
  fetchBankAccounts,
  fetchGstRates,
  fetchTermsTemplates,
} from "../../services/quotationApi";
import "../PurchaseOrder/PurchaseOrder.css";
import "./InvoiceEntryForm.css";

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
    values.find((value) => value !== null && value !== undefined && String(value).trim() !== "") || "";
  const reverseChargeDefault = [
    details.reverseChargeDefault,
    details.ReverseChargeDefault,
    details.reverse_charge_default,
    catalogMatch.reverseChargeDefault,
    catalogMatch.ReverseChargeDefault,
    catalogMatch.reverse_charge_default,
  ].some((value) => value === true || String(value).toLowerCase() === "true" || String(value).toLowerCase() === "yes");
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
    [...new Set(items.map((item) => item[field]).filter(Boolean).map(String))].join(", ");
  return {
    hsnCode: uniqueValues("hsnCode"),
    sacCode: uniqueValues("sacCode"),
    reverseCharge: items.some((item) => item.reverseChargeDefault) ? "Yes" : "No",
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

  const paise = Math.round((Math.max(0, Number(value) || 0) - wholeNumber) * 100);
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
      const price = getModulePrice(module, moduleCatalog);
      return {
        ...emptyItem(name, true, price),
        ...getModuleTaxDetails(module, moduleCatalog),
      };
    })
    .filter(Boolean);
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
          isSourceData: true,
        }))
      : [emptyItem("", true)];

  return {
    sourceInvoiceId: null,
    sourcePoId: normalizeId(poDetails.id || po?.id || null),
    sourceQuotationId: normalizeId(
      quotation?.quotationId || po?.quotationId || null,
    ),
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
}) {
  const [form, setForm] = useState(defaultForm);
  const [companyOptions, setCompanyOptions] = useState([]);
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
  const isPreloadedSource = Boolean(form.sourcePoId || form.sourceQuotationId);
  const isItemLocked = (item) => Boolean(item?.isSourceData);

  useEffect(() => {
    fetchModules()
      .then((data) => setModuleCatalog(Array.isArray(data) ? data : []))
      .catch(() => setModuleCatalog([]));

    fetchPurchaseOrderCompanies()
      .then(setCompanyOptions)
      .catch(() => setCompanyOptions([]));

    fetchQuotations(1, 500)
      .then((data) => setQuotationRecords(Array.isArray(data) ? data : []))
      .catch(() => setQuotationRecords([]));

    fetchInvoices()
      .then((data) => setInvoiceRecords(Array.isArray(data) ? data : []))
      .catch(() => setInvoiceRecords([]));
    fetchPurchaseOrders()
      .then((data) => setPurchaseOrders(Array.isArray(data) ? data : []))
      .catch(() => setPurchaseOrders([]));
    fetchCompanyProfiles().then(setCompanyProfiles).catch(() => setCompanyProfiles([]));
    fetchBankAccounts().then(setBankAccounts).catch(() => setBankAccounts([]));
    fetchGstRates().then(setGstRates).catch(() => setGstRates([]));
    fetchTermsTemplates().then(setTermsTemplates).catch(() => setTermsTemplates([]));
  }, []);

  const poQuotationIds = useMemo(
    () =>
      new Set(
        purchaseOrders
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
      (record) => String(record.quotationId ?? record.id) === String(selectedQuotationId),
    );
    if (!quotation) return;
    const quotationId = String(quotation.quotationId ?? quotation.id);
    const linkedPoSummary = purchaseOrders.find(
      (record) =>
        String(record.quotationId ?? record.po?.quotationId ?? "") === quotationId,
    );
    const linkedPoId = normalizeId(linkedPoSummary?.id ?? linkedPoSummary?.po?.id);
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
          isSourceData: true,
          ...getModuleTaxDetails(item, moduleCatalog),
        }))
      : null;
    const selectedItems = poItems || buildQuotationItems(source, moduleCatalog);
    const moduleTaxDetails = aggregateModuleTaxDetails(selectedItems);
    const profile = companyProfiles.find(
      (record) => (record.name || "").toLowerCase() === (source.organizationName || "").toLowerCase(),
    ) || companyProfiles.find((record) => record.isActive);
    const bank = bankAccounts.find((record) => record.isDefault) || bankAccounts.find((record) => record.isActive);
    const rate = gstRates.find((record) => record.isActive);
    const saleTerms = termsTemplates.find(
      (record) => record.type === "terms_of_sale" && record.isDefault && record.isActive,
    ) || termsTemplates.find((record) => record.type === "terms_of_sale" && record.isActive);
    setForm((prev) => ({
      ...prev,
      sourcePoId: linkedPoId || prev.sourcePoId,
      sourceQuotationId: normalizeId(source.quotationId ?? source.id),
      companyName: po.companyName || source.organizationName || prev.companyName,
      supplierName: po.supplierName || profile?.name || source.organizationName || prev.supplierName,
      supplierAddress: po.supplierAddress || profile?.address || prev.supplierAddress,
      supplierState: po.supplierState || profile?.state || prev.supplierState,
      supplierStateCode: po.supplierStateCode || profile?.stateCode || prev.supplierStateCode,
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
      receiverAddress: po.buyerAddress || source.quotationToAddress || prev.receiverAddress,
      receiverState: po.buyerState || prev.receiverState,
      receiverStateCode: po.buyerStateCode || prev.receiverStateCode,
      receiverGSTN: po.buyerGSTN || prev.receiverGSTN,
      consigneeName: po.buyerName || source.quotationToName || prev.consigneeName,
      consigneeAddress: po.buyerAddress || source.quotationToAddress || prev.consigneeAddress,
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
          return {
            id: record.id || invoice.id,
            invoice,
            ref: invoice.invoiceNo || `INV-${record.id || invoice.id}`,
            company: invoice.companyName || invoice.receiverName || "Unnamed customer",
            date: invoice.dateOfIssue || "Date pending",
            amount: Number(
              record.totals?.grandTotal ?? invoice.grandTotal ?? invoice.totalAmount ?? 0,
            ),
            current: normalizeId(form.sourceInvoiceId) === normalizeId(record.id || invoice.id),
          };
        })
        .filter((entry) =>
          `${entry.ref} ${entry.company}`.toLowerCase().includes(queueSearch.toLowerCase()),
        ),
    [invoiceRecords, queueSearch, form.sourceInvoiceId],
  );

  const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const selectInvoice = (entry) => {
    const invoice = entry.invoice || {};
    const items = Array.isArray(invoice.items) && invoice.items.length
      ? invoice.items.map((item) => ({
          id: Date.now() + Math.random(),
          description: item.description || "",
          qty: Number(item.qty) || 1,
          uom: item.uom || "Nos.",
          rate: Number(item.rate) || 0,
          isSourceData: true,
        }))
      : [emptyItem("", true)];
    setForm((prev) => ({
      ...prev,
      sourceInvoiceId: normalizeId(entry.id),
      ...invoice,
      items,
    }));
  };

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
    const rawPo = readStoredPurchaseOrder();
    const rawQuotation = readStoredQuotation();

    const hydrateSourceData = async () => {
      const purchaseOrder = rawPo?.po || rawPo;
      const sourcePoId = normalizeId(purchaseOrder?.id || rawPo?.id || null);
      const sourceQuotationId = normalizeId(
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
              items: itemRows,
            }));
          }
        }

        if (sourceQuotationId) {
          const remoteQuotation = await fetchQuotationById(sourceQuotationId);
          if (remoteQuotation) {
            setForm((prev) => ({
              ...prev,
              sourceQuotationId: normalizeId(
                remoteQuotation.quotationId || prev.sourceQuotationId || null,
              ),
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
                ? prev.items
                : buildQuotationItems(remoteQuotation, moduleCatalog),
            }));
          }
        }
      } catch (error) {
        console.error("Failed to hydrate invoice source data", error);
      }
    };

    hydrateSourceData();
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

    const loadMatchedQuotation = async () => {
      const quotationId = normalizeId(
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
          sourceQuotationId: normalizeId(
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
          sourceQuotationId: normalizeId(
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
          poNoDate: matchedQuotation.quotationNo
            ? `Quotation No. ${matchedQuotation.quotationNo}`
            : prev.poNoDate || "",
          items: buildQuotationItems(matchedQuotation, moduleCatalog),
        }));
      }
    };

    loadMatchedQuotation();
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

    const payload = {
      poId: normalizeId(form.sourcePoId),
      quotationId: normalizeId(form.sourceQuotationId),
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
      const saved = await createInvoice(payload);

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
      window.alert("Unable to save invoice to database. Please try again.");
    }
  };

  return (
    <div className="invoice-entry-page po-page">
        <div className="po-topbar invoice-entry-header">
          <div>
            <span className="invoice-entry-eyebrow">BILLING OPERATIONS</span>
            <h1>GST Invoice Entry</h1>
            <p>Prepare and save a tax invoice</p>
          </div>
          <div className="invoice-entry-actions">
            <button
              type="button"
              className="app-action-btn app-action-btn--secondary"
              onClick={() =>
                onNavigate(
                  sessionStorage.getItem("invoiceBackView") ||
                    defaultReturnView,
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
        </div>

        <main className="po-workspace invoice-workspace">
          <aside className="po-queue-panel invoice-queue-panel">
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
              <button type="button" className="active">All</button>
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
                    <span>SAVED</span>
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
          </aside>

          <section className="po-detail-panel invoice-detail-panel">
            <div className="po-detail-header">
              <div>
                <span className="po-eyebrow">SELECTED RECORD</span>
                <h1>{form.invoiceNo || "New invoice"}</h1>
                <p>{form.companyName || "No company selected"} · {form.dateOfIssue || "Date pending"}</p>
              </div>
              <div className="po-detail-actions">
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
                <button
                  type="submit"
                  form="invoice-entry-form"
                  className="app-action-btn app-action-btn--primary"
                >
                  Save
                </button>
              </div>
            </div>
            <form id="invoice-entry-form" onSubmit={handleSubmit}>
        <div className="invoice-entry-card">
          <section className="invoice-entry-section invoice-entry-identity">
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
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Invoice No.
              </div>
              <input
                value={form.invoiceNo}
                onChange={(e) => updateField("invoiceNo", e.target.value)}
                className="invoice-entry-control"
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Date of Issue
              </div>
              <input
                type="date"
                value={form.dateOfIssue}
                onChange={(e) => updateField("dateOfIssue", e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Time of Issue
              </div>
              <input
                value={form.timeOfIssue}
                onChange={(e) => updateField("timeOfIssue", e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Place of Service
              </div>
              <input
                value={form.placeOfService}
                onChange={(e) => updateField("placeOfService", e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                PO No. / Date
              </div>
              <input
                value={form.poNoDate}
                onChange={(e) => updateField("poNoDate", e.target.value)}
                style={inputStyle}
                readOnly={isPreloadedSource}
              />
            </label>
          </section>

          <div className="invoice-entry-party-grid">
            <div className="invoice-entry-section">
              <h3>Supplier Details</h3>
              <label>
                Name
                <input
                  value={form.supplierName}
                  onChange={(e) => updateField("supplierName", e.target.value)}
                  style={inputStyle}
                  readOnly={isPreloadedSource}
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
                  readOnly={isPreloadedSource}
                />
              </label>
              <label>
                State
                <input
                  value={form.supplierState}
                  onChange={(e) => updateField("supplierState", e.target.value)}
                  style={inputStyle}
                  readOnly={isPreloadedSource}
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
                  readOnly={isPreloadedSource}
                />
              </label>
              <label>
                GSTN No.
                <input
                  value={form.supplierGSTN}
                  onChange={(e) => updateField("supplierGSTN", e.target.value)}
                  style={inputStyle}
                  readOnly={isPreloadedSource}
                />
              </label>
            </div>

            <div className="invoice-entry-section">
              <h3>Receiver / Consignee</h3>
              <label>
                Name
                <input
                  value={form.receiverName}
                  onChange={(e) => updateField("receiverName", e.target.value)}
                  style={inputStyle}
                  readOnly={isPreloadedSource}
                />
              </label>
              <label>
                Address
                <input
                  value={form.receiverAddress}
                  onChange={(e) =>
                    updateField("receiverAddress", e.target.value)
                  }
                  style={inputStyle}
                  readOnly={isPreloadedSource}
                />
              </label>
              <label>
                State
                <input
                  value={form.receiverState}
                  onChange={(e) => updateField("receiverState", e.target.value)}
                  style={inputStyle}
                  readOnly={isPreloadedSource}
                />
              </label>
              <label>
                State Code
                <input
                  value={form.receiverStateCode}
                  onChange={(e) =>
                    updateField("receiverStateCode", e.target.value)
                  }
                  style={inputStyle}
                  readOnly={isPreloadedSource}
                />
              </label>
              <label>
                GSTN No.
                <input
                  value={form.receiverGSTN}
                  onChange={(e) => updateField("receiverGSTN", e.target.value)}
                  style={inputStyle}
                  readOnly={isPreloadedSource}
                />
              </label>
            </div>
          </div>

          <div className="invoice-entry-fields">
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Bank Name / Branch
              </div>
              <input
                value={form.bankName}
                onChange={(e) => updateField("bankName", e.target.value)}
                style={inputStyle}
                readOnly={isPreloadedSource}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Account No.
              </div>
              <input
                value={form.accountNo}
                onChange={(e) => updateField("accountNo", e.target.value)}
                style={inputStyle}
                readOnly={isPreloadedSource}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Account Type
              </div>
              <input
                value={form.accountType}
                onChange={(e) => updateField("accountType", e.target.value)}
                style={inputStyle}
                readOnly={isPreloadedSource}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>IFSC</div>
              <input
                value={form.ifsc}
                onChange={(e) => updateField("ifsc", e.target.value)}
                style={inputStyle}
                readOnly={isPreloadedSource}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>MSME No.</div>
              <input
                value={form.msmeNo}
                onChange={(e) => updateField("msmeNo", e.target.value)}
                style={inputStyle}
                readOnly={isPreloadedSource}
              />
            </label>
          </div>

          <div className="invoice-entry-section invoice-entry-items">
            <h3>Items</h3>
            <div className="invoice-entry-table-wrap">
              <table className="invoice-entry-table">
                <thead>
                  <tr>
                    <th>Description</th>
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
                            updateItem(item.id, "description", e.target.value)
                          }
                          readOnly={isItemLocked(item)}
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
          </div>

          <div className="invoice-entry-fields">
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>HSN Code</div>
              <input
                value={form.hsnCode}
                onChange={(e) => updateField("hsnCode", e.target.value)}
                style={inputStyle}
                readOnly={isPreloadedSource}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>SAC Code</div>
              <input
                value={form.sacCode}
                onChange={(e) => updateField("sacCode", e.target.value)}
                style={inputStyle}
                readOnly={isPreloadedSource}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Reverse Charge
              </div>
              <select
                value={form.reverseCharge}
                onChange={(e) => updateField("reverseCharge", e.target.value)}
                style={inputStyle}
                disabled={isPreloadedSource}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>SGST %</div>
              <input
                type="number"
                step="0.01"
                value={form.sgstPct}
                onChange={(e) =>
                  updateField("sgstPct", Number(e.target.value) || 0)
                }
                readOnly={isPreloadedSource}
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>CGST %</div>
              <input
                type="number"
                step="0.01"
                value={form.cgstPct}
                onChange={(e) =>
                  updateField("cgstPct", Number(e.target.value) || 0)
                }
                readOnly={isPreloadedSource}
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>IGST %</div>
              <input
                type="number"
                step="0.01"
                value={form.igstPct}
                onChange={(e) =>
                  updateField("igstPct", Number(e.target.value) || 0)
                }
                readOnly={isPreloadedSource}
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>TDS %</div>
              <input
                type="number"
                step="0.01"
                value={form.tdsPct}
                onChange={(e) =>
                  updateField("tdsPct", Number(e.target.value) || 0)
                }
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Insurance</div>
              <input
                type="number"
                step="0.01"
                value={form.insurance}
                onChange={(e) =>
                  updateField("insurance", Number(e.target.value) || 0)
                }
                style={inputStyle}
              />
            </label>
          </div>

          <div className="invoice-entry-fields invoice-entry-notes">
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Terms of Sale
              </div>
              <textarea
                value={form.termsOfSale}
                onChange={(e) => updateField("termsOfSale", e.target.value)}
                className="invoice-entry-control invoice-entry-textarea"
                readOnly={isPreloadedSource}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Amount in Words
              </div>
              <textarea
                value={amountInWords}
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                readOnly
              />
            </label>
          </div>

          <div className="invoice-entry-total">
            <span>Total Qty: {totals.totalQty}</span>
            <span>
              Grand Total: ₹
              {totals.grandTotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
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
              Selecting one fills the quotation, company, party, bank, GST, and terms data.
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
    </div>
  );
}
