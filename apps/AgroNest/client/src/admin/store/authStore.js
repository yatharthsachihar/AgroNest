import { create } from 'zustand';
import API from '../../api/axios';

export const useAuthStore = create((set, get) => ({
  admin: null,
  matrix: [],
  token: localStorage.getItem('agronest_token') || null,
  loading: true,

  hasPermission: (moduleKey, requiredLevel = 'view') => {
    const { admin, matrix } = get();
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    const mod = matrix?.find(m => m.key === moduleKey);
    if (!mod) return false;
    const level = mod.permissions[admin.role] || 'none';
    if (requiredLevel === 'full') return level === 'full';
    if (requiredLevel === 'view') return level === 'full' || level === 'view';
    return false;
  },

  init: async () => {
    const token = localStorage.getItem('agronest_token');
    if (!token) {
      set({ loading: false, admin: null });
      return;
    }
    try {
      // Run both requests in parallel instead of sequentially — this was
      // previously awaiting /auth/me, then only AFTER it resolved kicking
      // off /roles/matrix. That serial round-trip was the single biggest
      // contributor to the delay before the admin panel (sidebar, topbar,
      // dashboard) appeared at all on every hard refresh.
      const [meRes, matrixRes] = await Promise.allSettled([
        API.get('/auth/me'),
        API.get('/roles/matrix'),
      ]);

      if (meRes.status !== 'fulfilled') throw meRes.reason;

      set({
        admin:   meRes.value.data,
        matrix:  matrixRes.status === 'fulfilled' ? matrixRes.value.data : [],
        token,
        loading: false,
      });
    } catch {
      localStorage.removeItem('agronest_token');
      set({ admin: null, matrix: [], token: null, loading: false });
    }
  },

  // Silent background refresh — only updates the permission matrix.
  // Does NOT touch loading/admin, so it never re-triggers entrance
  // animations or layout remounts on pages that depend on those.
  refreshMatrix: async () => {
    const { token, matrix } = get();
    if (!token) return;
    try {
      const matrixRes = await API.get('/roles/matrix');
      const next = matrixRes.data;
      // Only update state if the matrix actually changed — avoids
      // pointless re-renders on every poll tick.
      if (JSON.stringify(next) !== JSON.stringify(matrix)) {
        set({ matrix: next });
      }
    } catch (err) {
      // Silent — a failed background poll shouldn't log the admin out
      // or disrupt whatever page they're on.
    }
  },

  login: async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    localStorage.setItem('agronest_token', res.data.token);
    let matrixRes = { data: [] };
    try {
      matrixRes = await API.get('/roles/matrix');
    } catch (err) {}
    set({ admin: res.data.admin, matrix: matrixRes.data, token: res.data.token, loading: false });
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('agronest_token');
    set({ admin: null, matrix: [], token: null });
  },
}));
