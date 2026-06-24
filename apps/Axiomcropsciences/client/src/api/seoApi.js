import API from './axios';
export const seoApi = {
  get: () => API.get('/seo'),
  update: (data) => API.put('/seo', data),
};
