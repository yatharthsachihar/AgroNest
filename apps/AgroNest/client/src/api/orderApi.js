import API from './axios';

export const orderApi = {
  create: (data) => API.post('/orders', data),
  getAll: (params) => API.get('/orders', { params }),
  getOne: (id) => API.get(`/orders/${id}`),
  updateStatus: (id, data) => API.put(`/orders/${id}`, data),
  pay: (id, data) => API.put(`/orders/${id}/pay`, data),
  remove: (id) => API.delete(`/orders/${id}`),
  getMyOrders: () => API.get('/orders/my-orders'),
  cancel: (id) => API.put(`/orders/${id}/cancel`),
};
