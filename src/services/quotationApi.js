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

/** GET /api/modules reads the database-backed Modules master table. */
export async function fetchModules() {
  const { data } = await client.get("/api/modules");
  return data.map((module) => ({
    pillar: module.pillar ?? module.Pillar ?? "",
    module: module.moduleName ?? module.ModuleName ?? module.module ?? module.Module ?? "",
    price: module.price ?? module.Price ?? null,
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

/**
 * GET /api/quotation/dashboard
 * returns: Dashboard analytics data
 */
export async function fetchDashboardData() {
  const { data } = await client.get("/api/quotation/dashboard");
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

/**
 * Fetch unique reference by names from quotation history
 * Returns a list of unique reference by names
 */
export async function fetchReferences() {
  const { data } = await client.get("/api/quotation/history", {
    params: { page: 1, pageSize: 500 }
  });
  const references = [...new Set(data.map((q) => q.referenceBy).filter(Boolean))];
  return references.sort();
}

export default client;
