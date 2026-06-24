import API from './axios';
export const blogApi = {
  getAll: (params) => API.get('/blogs', { params }),
  getOne: (id) => API.get(`/blogs/${id}`),
  create: (data) => API.post('/blogs', data),
  update: (id, data) => API.put(`/blogs/${id}`, data),
  remove: (id) => API.delete(`/blogs/${id}`),
};
