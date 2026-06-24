import API from './axios';

export const orderApi = {
  create:       (data)       => API.post('/orders', data),
  getAll:       (params)     => API.get('/orders', { params }),
  getOne:       (id)         => API.get(`/orders/${id}`),
  updateStatus: (id, data)   => API.put(`/orders/${id}`, data),
  pay:          (id, data)   => API.put(`/orders/${id}/pay`, data),
  remove:       (id)         => API.delete(`/orders/${id}`),
  getMyOrders:  ()           => API.get('/orders/my-orders'),
  cancel:       (id)         => API.put(`/orders/${id}/cancel`),

  // ── Razorpay 2-step flow ──
  // Step 1: create a Razorpay Order on the server (returns rzpOrderId or simulationMode flag)
  createRazorpayOrder: (appOrderId) =>
    API.post('/razorpay/create-order', { appOrderId }),

  // Step 2: verify the payment signature on the server after Razorpay checkout completes
  verifyRazorpayPayment: (data) =>
    API.post('/razorpay/verify', data),
};
