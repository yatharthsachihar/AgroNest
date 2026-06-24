import { create } from 'zustand';
import API from '../../api/axios';

export const useDashboardStore = create((set, get) => ({
  stats:        null,
  revenueChart: [],
  ordersChart:  [],
  recentOrders: [],
  topProducts:  [],
  loading:      false,
  // True once the first successful (or failed) fetch has completed.
  // Distinct from `loading` — `loading` is false both before the very
  // first fetch starts AND after it finishes, so it can't be used alone
  // to gate "is there real data on screen yet".
  hasLoaded:    false,
  lastFetched:  null, // timestamp — prevents redundant refetches

  fetchDashboard: async (force = false) => {
    const { loading, lastFetched } = get();

    // ── Guard: skip if already loading or fetched < 30s ago ──
    if (loading) return;
    if (!force && lastFetched && Date.now() - lastFetched < 30_000) return;

    set({ loading: true });

    try {
      // ── Fetch only what we need, with tight limits ──
      const [ordersRes, productsRes, statsRes] = await Promise.allSettled([
        API.get('/orders?limit=100&sort=-createdAt'),          // max 100 orders for stats
        API.get('/products?limit=5&sort=-createdAt'),          // only top 5 for the widget
        API.get('/orders?limit=6&sort=-createdAt'),            // recent 6 for the table
      ]);

      // ── Safe unwrap ──
      const ordersData   = ordersRes.status   === 'fulfilled' ? ordersRes.value.data   : {};
      const productsData = productsRes.status === 'fulfilled' ? productsRes.value.data : {};
      const recentData   = statsRes.status    === 'fulfilled' ? statsRes.value.data    : {};

      const orders   = Array.isArray(ordersData)   ? ordersData   : (ordersData.orders   || []);
      const products = Array.isArray(productsData) ? productsData : (productsData.products || []);
      const recent   = Array.isArray(recentData)   ? recentData   : (recentData.orders   || []);

      // ── Revenue total ──
      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // ── Monthly revenue chart (ordered Jan–Dec) ──
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthlyMap = {};
      orders.forEach(o => {
        const m = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
        monthlyMap[m] = (monthlyMap[m] || 0) + (o.totalAmount || 0);
      });
      const revenueChart = MONTHS.map(month => ({
        month,
        revenue: monthlyMap[month] || 0
      }));

      // ── Orders by status chart ──
      const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      const statusCounts = {};
      orders.forEach(o => {
        const status = o.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const ordersChart = STATUSES.map(status => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: statusCounts[status] || 0
      }));

      set({
        stats: {
          totalRevenue,
          totalOrders:   orders.length,
          totalProducts: productsData.total || products.length,
          pendingOrders: orders.filter(o => o.status === 'pending').length,
        },
        revenueChart,
        ordersChart,
        recentOrders: recent.slice(0, 6),
        topProducts:  products.slice(0, 5),
        loading:      false,
        hasLoaded:    true,
        lastFetched:  Date.now(),
      });

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      set({ loading: false, hasLoaded: true });
    }
  },

  // Force a fresh fetch (used by the refresh button)
  refresh: () => {
    const { fetchDashboard } = get();
    fetchDashboard(true);
  },
}));
