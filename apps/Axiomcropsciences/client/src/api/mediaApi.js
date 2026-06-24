import API from './axios';
export const mediaApi = {
  getAll: (params) => API.get('/media', { params }),
  upload: (formData) => API.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id) => API.delete(`/media/${id}`),
};
