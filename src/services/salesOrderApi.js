import client from "./quotationApi";

export async function fetchSalesOrders(params = {}) {
  const { data } = await client.get("/api/sales-orders", { params });
  return data;
}

export async function fetchSalesOrder(id) {
  const { data } = await client.get(`/api/sales-orders/${id}`);
  return data;
}

export async function fetchSalesOrderPoPreview(poId) {
  const { data } = await client.get(`/api/sales-orders/po-preview/${poId}`);
  return data;
}

export async function createSalesOrderFromPo(poId) {
  const { data } = await client.post(`/api/sales-orders/from-po/${poId}`);
  return data;
}

export async function updateSalesOrder(id, payload) {
  const { data } = await client.put(`/api/sales-orders/${id}`, payload);
  return data;
}

export async function submitSalesOrder(id) {
  const { data } = await client.post(`/api/sales-orders/${id}/submit`);
  return data;
}

export async function fetchSalesOrderMasters() {
  const [modules, gstRates, bankAccounts, termsTemplates, customers] =
    await Promise.all([
      client.get("/api/modules"),
      client.get("/api/gst-rates"),
      client.get("/api/company-bank-accounts"),
      client.get("/api/terms-templates"),
      client.get("/api/customers"),
    ]);

  return {
    modules: Array.isArray(modules.data) ? modules.data : [],
    gstRates: Array.isArray(gstRates.data) ? gstRates.data : [],
    bankAccounts: Array.isArray(bankAccounts.data) ? bankAccounts.data : [],
    termsTemplates: Array.isArray(termsTemplates.data) ? termsTemplates.data : [],
    customers: Array.isArray(customers.data) ? customers.data : [],
  };
}
