import API from './axios';
export const pageApi = {
  getAll: () => API.get('/pages'),
  getOne: (slug) => API.get(`/pages/${slug}`),
  create: (data) => API.post('/pages', data),
  update: (id, data) => API.put(`/pages/${id}`, data),
  remove: (id) => API.delete(`/pages/${id}`),
};
