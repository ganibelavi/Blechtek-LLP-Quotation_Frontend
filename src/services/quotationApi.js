import axios from "axios";

const client = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "https://localhost:5001",
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

export default client;
