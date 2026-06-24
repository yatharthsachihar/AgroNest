import API from './axios';
export const categoryApi = {
  getAll: (params) => API.get('/categories', { params }),
  getOne: (id) => API.get(`/categories/${id}`),
  create: (data) => API.post('/categories', data),
  update: (id, data) => API.put(`/categories/${id}`, data),
  remove: (id) => API.delete(`/categories/${id}`),
};
