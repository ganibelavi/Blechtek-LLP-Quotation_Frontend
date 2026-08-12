import axios from "axios";

const client = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "https://localhost:5001",
  headers: { "Content-Type": "application/json" }
});

/** GET /api/modules -> [{ pillar, module }] */
export async function fetchModules() {
  const { data } = await client.get("/api/modules");
  return data;
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

/** Resolves a relative download URL returned by the API into an absolute one. */
export function resolveDownloadUrl(path) {
  return `${client.defaults.baseURL}${path}`;
}

export default client;
