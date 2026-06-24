import API from './axios';
export const enquiryApi = {
  // Public — submit a new enquiry (no auth needed)
  submit: (data) => API.post('/enquiries', data),

  // Admin — read all enquiries
  getAll: (params) => API.get('/enquiries', { params }),
  getOne: (id)    => API.get(`/enquiries/${id}`),
  update: (id, data) => API.put(`/enquiries/${id}`, data),
  remove: (id)    => API.delete(`/enquiries/${id}`),
};
