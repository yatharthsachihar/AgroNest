import API from './axios';
export const bannerApi = {
  getAll: (adminView = true) => API.get('/banners', { params: adminView ? { all: true } : {} }),
  create: (data) => API.post('/banners', data),
  update: (id, data) => API.put(`/banners/${id}`, data),
  remove: (id) => API.delete(`/banners/${id}`),
};

