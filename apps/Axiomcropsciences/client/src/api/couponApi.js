import API from './axios';
export const couponApi = {
  getAll: (params) => API.get('/coupons', { params }),
  getActive: () => API.get('/coupons/active'),
  validate: (data) => API.post('/coupons/validate', data),
  create: (data) => API.post('/coupons', data),
  update: (id, data) => API.put(`/coupons/${id}`, data),
  remove: (id) => API.delete(`/coupons/${id}`),
};
