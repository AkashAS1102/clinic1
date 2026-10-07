import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 8000,
});

api.interceptors.response.use(
  res => res,
  err => {
    console.error('[Stock API Error]', err.config?.url, err.message);
    return Promise.reject(err);
  }
);

// ── Product Master ────────────────────────────────────────────────────────────
export const stockApi = {
  // Products
  getProducts: ()           => api.get('/stock/products').then(r => r.data),
  createProduct: (data)     => api.post('/stock/products', data).then(r => r.data),
  updateProduct: (id, data) => api.put(`/stock/products/${id}`, data).then(r => r.data),
  deleteProduct: (id)       => api.delete(`/stock/products/${id}`).then(r => r.data),

  // Purchase Orders
  getPOs: (status)          => api.get('/stock/po', { params: status ? { status } : {} }).then(r => r.data),
  createPO: (data)          => api.post('/stock/po', data).then(r => r.data),
  approvePO: (id)           => api.put(`/stock/po/${id}/approve`).then(r => r.data),
  sendPO: (id)              => api.put(`/stock/po/${id}/send`).then(r => r.data),
  cancelPO: (id)            => api.put(`/stock/po/${id}/cancel`).then(r => r.data),

  // GRN / Inwarding
  getGrnItems: (poId)       => api.get('/stock/grn', { params: poId ? { poId } : {} }).then(r => r.data),
  saveGrnItem: (data)       => api.post('/stock/grn', data).then(r => r.data),
  verifyGrnItem: (id, body) => api.put(`/stock/grn/${id}/verify`, body).then(r => r.data),

  // Inventory Ledger
  getLedger: ()             => api.get('/stock/ledger').then(r => r.data),
  getCurrentStock: (pid)    => api.get(`/stock/ledger/${pid}/stock`).then(r => r.data),

  // Purchase Returns
  getReturns: ()            => api.get('/stock/returns').then(r => r.data),
  processReturn: (data)     => api.post('/stock/returns', data).then(r => r.data),
};
