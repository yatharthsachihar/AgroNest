import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api' });

API.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('agronest_token');
  const userToken  = localStorage.getItem('agronest_user_token');

  const isAdminPanel = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // Prefer adminToken on the admin panel or for /auth endpoints
  if (isAdminPanel || config.url?.startsWith('/auth')) {
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      return config;
    }
  }

  const isPublicUserAuth = config.url?.startsWith('/users/login') || config.url?.startsWith('/users/register');

  // Fallback to userToken on standard site, or adminToken if no userToken exists
  if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  } else if (adminToken && !isPublicUserAuth) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      // If we receive a 403 Forbidden, dispatch event so UserContext can navigate
      // instead of a hard reload which penalizes performance.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-error-403'));
      }
    }
    return Promise.reject(error);
  }
);

export default API;
