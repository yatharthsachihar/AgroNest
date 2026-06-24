import API from './axios';
export const userApi = {
  getAll: (params) => API.get('/users', { params }),
  getOne: (id) => API.get(`/users/${id}`),
  create: (data) => API.post('/users', data),
  update: (id, data) => API.put(`/users/${id}`, data),
  remove: (id) => API.delete(`/users/${id}`),
  deleteMe: () => API.delete('/users/me'),
};
