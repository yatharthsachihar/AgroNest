import API from './axios';

export const productApi = {
  // Admin — paginated, any status
  getAll: (params = {}) => API.get('/products', {
    params: { page: 1, limit: 20, ...params },
  }),

  // Public — single product by slug or id (the product carries its embedded
  // variations array, so there is no separate variations endpoint)
  getOne: (slugOrId) => API.get(`/products/${slugOrId}`),

  // Admin — create
  create: (data) => API.post('/products', data),

  // Admin — update by _id
  update: (id, data) => API.put(`/products/${id}`, data),

  // Admin — quick stock/inventory update only
  updateStock: (id, data) => API.patch(`/products/${id}/stock`, data),

  // Admin — toggle collection flags only (featured / bestseller / etc.)
  updateFlags: (id, flags) => API.patch(`/products/${id}/flags`, flags),

  // Admin — delete by _id
  remove: (id) => API.delete(`/products/${id}`),

  // Admin — bulk import from CSV (+ optional image files), multipart form-data
  importCsv: (formData) => API.post('/products/import', formData),

  // Admin — bulk delete
  bulkDelete: (ids) => API.post('/products/bulk-delete', { ids }),

  // Admin — bulk activate/deactivate
  bulkUpdateStatus: (ids, status) => API.post('/products/bulk-status', { ids, status }),
};
