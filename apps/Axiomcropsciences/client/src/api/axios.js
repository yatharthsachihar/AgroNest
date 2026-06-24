import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Origin that serves uploaded files (the API host without the trailing /api).
// Empty string when the API is same-origin (relative '/api' base).
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

// Resolve a stored image path to a loadable URL. Full http(s) URLs and data
// URIs pass through untouched; server-relative paths (e.g. /uploads/media/x.png)
// are prefixed with the API origin so they load no matter where the frontend
// is hosted relative to the API.
export const mediaUrl = (u) => {
  if (!u) return u;
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u;
  return `${API_ORIGIN}${u.startsWith('/') ? '' : '/'}${u}`;
};

const API = axios.create({ baseURL: API_BASE });

API.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('axiomcropsciences_token');
  const userToken  = localStorage.getItem('axiomcropsciences_user_token');

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
        const isAdminPanel = window.location.pathname.startsWith('/admin');
        if (!isAdminPanel) {
          window.dispatchEvent(new Event('auth-error-403'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
