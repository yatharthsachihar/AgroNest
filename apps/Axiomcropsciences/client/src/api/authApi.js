import API from './axios';

/* ── Admin auth (panel) ── */
export const authApi = {
  login:    (data) => API.post('/auth/login', data),
  me:       ()     => API.get('/auth/me'),
};

/* ── Site user auth ── */
export const userAuthApi = {
  register: (data) => API.post('/users/register', data),
  login:    (data) => API.post('/users/login', data),
  me:       ()     => API.get('/users/me'),
  status:   ()     => API.get('/users/status'),
  update:   (data) => API.put('/users/me', data),
};
