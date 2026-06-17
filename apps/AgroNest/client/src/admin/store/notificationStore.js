import { create } from 'zustand';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const getToken = () => localStorage.getItem('agronest_token');

const useNotificationStore = create((set, get) => ({
  notifications:  [],
  unreadCount:    0,
  isConnected:    false,
  eventSource:    null,
  soundEnabled:   true,
  isRinging:      false,       // ← drives bell animation; auto-clears after 3s

  /* ── Fetch from DB ────────────────────────────────── */
  fetchNotifications: async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data?.success) {
        set({ notifications: res.data.data, unreadCount: res.data.unreadCount });
      }
    } catch { /* server might be offline — silent */ }
  },

  /* ── SSE connection ───────────────────────────────── */
  connectSSE: () => {
    // Don't open a second connection
    if (get().isConnected || get().eventSource) return;

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');
    const es = new EventSource(`${baseUrl}/notifications/stream`);

    es.onopen = () => set({ isConnected: true, eventSource: es });

    es.addEventListener('notification', (event) => {
      try {
        const notif = JSON.parse(event.data);

        set((state) => {
          // De-duplicate
          if (state.notifications.some(n => n._id === notif._id)) return state;
          return {
            notifications: [notif, ...state.notifications],
            unreadCount:   state.unreadCount + 1,
            isRinging:     true,   // trigger bell animation
          };
        });

        // Auto-clear ringing after 3 s
        setTimeout(() => set({ isRinging: false }), 3000);

        // Toast
        toast(notif.message, {
          icon: '🔔',
          duration: 5000,
          style: {
            borderRadius: 12,
            background: 'var(--card, #1a1a1a)',
            color: 'var(--text, #fff)',
            border: '1px solid var(--border, #333)',
          },
        });

        // Sound
        if (get().soundEnabled) {
          try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch { /* no sound file — ignore */ }
        }

        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification(`AgroNest — ${notif.title}`, {
            body:  notif.message,
            icon:  '/favicon.ico',
          });
        }

        // Custom event (for any component that wants to hook in)
        window.dispatchEvent(new CustomEvent('new-notification', { detail: notif }));
      } catch { /* malformed payload */ }
    });

    es.onerror = () => {
      es.close();
      set({ isConnected: false, eventSource: null });
      // Retry after 8 s — clear isConnected first so the guard passes
      setTimeout(() => get().connectSSE(), 8000);
    };
  },

  disconnectSSE: () => {
    const { eventSource } = get();
    if (eventSource) {
      eventSource.close();
      set({ isConnected: false, eventSource: null });
    }
  },

  /* ── CRUD ─────────────────────────────────────────── */
  markAsRead: async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      set((s) => ({
        notifications: s.notifications.map(n => n._id === id ? { ...n, read: true } : n),
        unreadCount:   Math.max(0, s.unreadCount - 1),
      }));
    } catch { /* silent */ }
  },

  markAllAsRead: async () => {
    try {
      await API.put('/notifications/read-all');
      set((s) => ({
        notifications: s.notifications.map(n => ({ ...n, read: true })),
        unreadCount:   0,
      }));
    } catch { /* silent */ }
  },

  deleteNotification: async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      set((s) => {
        const notif    = s.notifications.find(n => n._id === id);
        const wasUnread = notif && !notif.read;
        return {
          notifications: s.notifications.filter(n => n._id !== id),
          unreadCount:   wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
        };
      });
    } catch { /* silent */ }
  },

  clearAll: async () => {
    try {
      await API.delete('/notifications/clear');
      set({ notifications: [], unreadCount: 0 });
    } catch { /* silent */ }
  },

  /* ── Settings ─────────────────────────────────────── */
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  requestBrowserPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  },
}));

export default useNotificationStore;
