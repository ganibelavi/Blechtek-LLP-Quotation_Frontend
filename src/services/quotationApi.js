import axios from "axios";

const resolveApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_BASE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "";
  }

  return "http://localhost:5000";
};

const client = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { "Content-Type": "application/json" }
});

// Add auth token interceptor
client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("qa_token");
    console.log('API Request:', config.url, 'Token present:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No auth token found in localStorage!');
    }
  }
  return config;
});

// Add response interceptor to handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - redirecting to login');
      // Clear invalid token
      localStorage.removeItem("qa_token");
      localStorage.removeItem("qa_user");
      // Redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/** GET /api/modules reads the database-backed Modules master table. */
export async function fetchModules() {
  const { data } = await client.get("/api/modules");
  return data.map((module) => ({
    pillar: module.pillar ?? module.Pillar ?? "",
    module: module.moduleName ?? module.ModuleName ?? module.module ?? module.Module ?? "",
    price: module.price ?? module.Price ?? null,
    hsnCode: module.hsnCode ?? module.HsnCode ?? module.hsn_code ?? "",
    sacCode: module.sacCode ?? module.SacCode ?? module.sac_code ?? "",
    reverseChargeDefault:
      module.reverseChargeDefault ??
      module.ReverseChargeDefault ??
      module.reverse_charge_default ??
      false,
    implementationEffortCost:
      module.implementationEffortCost ??
      module.ImplementationEffortCost ??
      null,
    implementationEffortManDays:
      module.implementationEffortManDays ??
      module.ImplementationEffortManDays ??
      null,
    noOfUsersForSingleInstallation:
      module.noOfUsersForSingleInstallation ??
      module.NoOfUsersForSingleInstallation ??
      null,
  }));
}

/**
 * POST /api/quotation/generate
 * payload: { validationDate, organizationName, selectedModules, quotationTo }
 * returns: { quotationId, organizationName, generatedAt, wordDownloadUrl, pdfDownloadUrl }
 */
export async function generateQuotation(payload) {
  const { data } = await client.post("/api/quotation/generate", payload);
  return data;
}

/**
 * GET /api/quotation/history
 * returns: List of quotation history entries
 */
export async function fetchQuotations(page = 1, pageSize = 50) {
  const { data } = await client.get("/api/quotation/history", {
    params: { page, pageSize }
  });
  return data;
}

export async function fetchAllQuotations(pageSize = 500) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Quotation page size must be a positive integer.");
  }

  const quotations = [];
  let page = 1;

  while (true) {
    const rows = await fetchQuotations(page, pageSize);
    if (!Array.isArray(rows)) {
      throw new Error("The quotation history response is not a list.");
    }

    quotations.push(...rows);
    if (rows.length < pageSize) return quotations;
    page += 1;
  }
}

export async function fetchQuotationRevisions(quotationId) {
  const { data } = await client.get(`/api/quotation/${quotationId}/revisions`);
  return data;
}

export async function fetchQuotationById(quotationId) {
  const { data } = await client.get(`/api/quotation/${quotationId}`);
  return data || null;
}

export async function fetchPurchaseOrderById(purchaseOrderId) {
  const { data } = await client.get(`/api/purchase-order/${purchaseOrderId}`);
  return data;
}

export async function fetchInvoiceById(invoiceId) {
  const { data } = await client.get(`/api/invoice/${invoiceId}`);
  return data;
}

/**
 * GET /api/quotation/dashboard
 * returns: Dashboard analytics data
 */
export async function fetchDashboardData() {
  const { data } = await client.get("/api/quotation/dashboard");
  return data;
}

export async function fetchCustomerSubscriptions() {
  const { data } = await client.get("/api/customer-subscriptions");
  return Array.isArray(data) ? data : [];
}

export async function fetchSubscriptionInvoices(customerName) {
  const { data } = await client.get("/api/customer-subscriptions/invoices", {
    params: customerName ? { customerName } : undefined,
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchRenewals(filter) {
  const { data } = await client.get("/api/renewals", {
    params: filter ? { filter } : undefined,
  });
  return Array.isArray(data) ? data : [];
}

export async function linkRenewalQuotation(renewalId, quotationId) {
  const { data } = await client.post(`/api/renewals/${renewalId}/link-quotation`, {
    quotationId,
  });
  return data;
}

export async function linkRenewalInvoice(renewalId, invoiceId) {
  const { data } = await client.post(`/api/renewals/${renewalId}/link-invoice`, {
    invoiceId,
  });
  return data;
}

/** Resolves a relative download URL returned by the API into an absolute one. */
export function resolveDownloadUrl(path) {
  if (!path) return "";
  return `${client.defaults.baseURL}${path}`;
}

/**
 * PUT /api/quotation/{quotationId}/discount
 * payload: { discountPercentage }
 * returns: { quotationId, organizationName, generatedAt, wordDownloadUrl, pdfDownloadUrl }
 */
export async function updateDiscount(quotationId, discountPercentage) {
  const { data } = await client.put(`/api/quotation/${quotationId}/discount`, { discountPercentage });
  return data;
}

/**
 * PUT /api/quotation/{quotationId}
 * payload: { validationDate, selectedModules, referenceBy, organizationName, quotationTo, date, discountPercentage }
 * returns: updated quotation data
 */
export async function updateQuotation(quotationId, payload) {
  const { data } = await client.put(`/api/quotation/${quotationId}`, payload);
  return data;
}

/**
 * POST /api/quotation/{quotationId}/send-email
 * payload: { recipientEmail, subject, message, attachPdf }
 */
export async function sendQuotationEmail(quotationId, payload) {
  const { data } = await client.post(`/api/quotation/${quotationId}/send-email`, payload);
  return data;
}

export async function createPurchaseOrder(payload) {
  const { data } = await client.post("/api/purchase-order", payload);
  return data;
}

export async function updatePurchaseOrder(id, payload) {
  const { data } = await client.put(`/api/purchase-order/${id}`, payload);
  return data;
}

export async function fetchNextPurchaseOrderNo() {
  const { data } = await client.get("/api/purchase-order/next-number");
  return data.poNo;
}

export async function fetchPurchaseOrders() {
  const { data } = await client.get("/api/purchase-order");
  return data;
}

export async function updatePurchaseOrderVerification(id, payload) {
  const { data } = await client.patch(`/api/purchase-order/${id}/verification`, payload);
  return data;
}

export async function deletePurchaseOrder(id) {
  await client.delete(`/api/purchase-order/${id}`);
}

export async function fetchQuotationsForPo() {
  const { data } = await client.get("/api/purchase-order/quotations-for-po");
  return Array.isArray(data) ? data : [];
}

export async function fetchPoVerification(id) {
  const { data } = await client.get(`/api/purchase-order/${id}/verification`);
  return data;
}

export async function updatePoClientDetails(id, payload) {
  const { data } = await client.put(`/api/purchase-order/${id}/client-details`, payload);
  return data;
}

export async function approvePo(id, payload) {
  const { data } = await client.post(`/api/purchase-order/${id}/approve`, payload);
  return data;
}

export async function rejectPo(id, payload) {
  const { data } = await client.post(`/api/purchase-order/${id}/reject`, payload);
  return data;
}

export async function reopenPo(id, payload) {
  const { data } = await client.post(`/api/purchase-order/${id}/reopen`, payload);
  return data;
}

export async function fetchPoAuditLog(id) {
  const { data } = await client.get(`/api/purchase-order/${id}/audit-log`);
  return Array.isArray(data) ? data : [];
}

export async function fetchPoFile(id) {
  try {
    const response = await client.get(`/api/purchase-order/${id}/file`, {
      responseType: 'blob',
      timeout: 10000,
    });
    return response.data;
  } catch (err) {
    // Handle axios error with blob responseType - the error response won't be parsed
    if (err.response) {
      // Try to get error message from blob if possible
      const status = err.response.status;
      const statusText = err.response.statusText;
      const error = new Error(`HTTP ${status}: ${statusText}`);
      error.response = { status, statusText };
      throw error;
    }
    throw err;
  }
}

export async function uploadPoFile(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post(`/api/purchase-order/${id}/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}

export async function createInvoice(payload) {
  const { data } = await client.post("/api/invoice", payload);
  return data;
}

export async function fetchNextInvoiceNo() {
  const { data } = await client.get("/api/invoice/next-number");
  return data.invoiceNo;
}

export async function fetchInvoices(options = {}) {
  const { data } = await client.get("/api/invoice", {
    params: options.excludeRenewalSubscriptionInvoices
      ? { excludeRenewalSubscriptionInvoices: true }
      : undefined,
  });
  return data;
}

export async function deleteInvoice(id) {
  await client.delete(`/api/invoice/${id}`);
}

export async function updateInvoice(id, payload) {
  const { data } = await client.put(`/api/invoice/${id}`, payload);
  return data;
}

export async function updateInvoiceStatus(id, status) {
  const { data } = await client.patch(`/api/invoice/${id}/status`, { status });
  return data;
}

/**
 * GET /api/quotation/next-quotation-no
 * returns: { quotationNo: "BTSS/FY2025-26/PR-000X" }
 */
export async function fetchNextQuotationNo() {
  const { data } = await client.get("/api/quotation/next-quotation-no");
  return data.quotationNo;
}

/**
 * Fetch unique organization names from quotation history
 * Returns a list of unique organization names
 */
export async function fetchOrganizations() {
  const { data } = await client.get("/api/quotation/history", {
    params: { page: 1, pageSize: 500 }
  });
  const organizations = [...new Set(data.map((q) => q.organizationName).filter(Boolean))];
  return organizations.sort();
}

/** GET /api/customers reads the database-backed Customers master table. */
export async function fetchCustomers() {
  const { data } = await client.get("/api/customers");
  return Array.isArray(data) ? data : [];
}

export async function fetchReferences() {
  const { data } = await client.get("/api/references");
  return Array.isArray(data)
    ? data.map((reference) => reference.name ?? reference.Name ?? "").filter(Boolean)
    : [];
}

export async function createReference(payload) {
  const { data } = await client.post("/api/references", payload);
  return data;
}

export async function createCustomer(payload) {
  const { data } = await client.post("/api/customers", payload);
  return data;
}

/** GET /api/suppliers reads the database-backed Suppliers master table. */
export async function fetchSuppliers() {
  const { data } = await client.get("/api/suppliers");
  return Array.isArray(data) ? data : [];
}

export async function fetchCompanyProfiles() {
  const { data } = await client.get("/api/company-profile");
  return Array.isArray(data) ? data : [];
}

export async function fetchBankAccounts() {
  const { data } = await client.get("/api/company-bank-accounts");
  return Array.isArray(data) ? data : [];
}

export async function fetchGstRates() {
  const { data } = await client.get("/api/gst-rates");
  return Array.isArray(data) ? data : [];
}

export async function fetchTermsTemplates() {
  const { data } = await client.get("/api/terms-templates");
  return Array.isArray(data) ? data : [];
}

export async function fetchPurchaseOrderCompanies() {
  const { data } = await client.get("/api/purchase-order");
  const companies = [...new Set(
    data
      .map((po) => po.companyName || po.buyerName || po.supplierName || po.po?.companyName || po.po?.buyerName || po.po?.supplierName)
      .filter(Boolean),
  )];
  return companies.sort();
}

export default client;
