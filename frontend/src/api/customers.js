import api from "./client";

export const searchCustomers = async (q) => {
  const r = await api.get("/customers", { params: { q } });
  return r.data || [];
};

export const getCustomerCredit = async (id) => {
  const r = await api.get(`/customers/${id}/credit`);
  return r.data;
};
