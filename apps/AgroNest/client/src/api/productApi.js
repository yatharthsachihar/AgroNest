import API from './axios';

export const productApi = {
  // Admin — paginated, any status
  getAll: (params = {}) => API.get('/products', {
    params: { page: 1, limit: 20, ...params },
  }),

  // Public — single product by slug or id
  getOne: (slugOrId) => API.get(`/products/${slugOrId}`),

  // Public — get variations of a product
  getVariations: (slugOrId) => API.get(`/products/${slugOrId}/variations`),

  // Admin — create
  create: (data) => API.post('/products', data),

  // Admin — update by _id
  update: (id, data) => API.put(`/products/${id}`, data),

  // Admin — quick stock/inventory update only
  updateStock: (id, data) => API.patch(`/products/${id}/stock`, data),

  // Admin — delete by _id
  remove: (id) => API.delete(`/products/${id}`),

  // Admin — bulk delete
  bulkDelete: (ids) => API.post('/products/bulk-delete', { ids }),
};
