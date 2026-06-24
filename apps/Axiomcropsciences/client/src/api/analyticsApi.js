import API from './axios';
export const analyticsApi = {
  getSummary: () => API.get('/analytics/summary'),
  getRevenue: (params) => API.get('/analytics/revenue', { params }),
  getProducts: () => API.get('/analytics/products'),
};
