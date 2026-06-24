const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  streamNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications
} = require('../controllers/notificationController');

// All notification routes are protected and require admin privileges
// Note: /stream might not be easily protected with a Bearer token if using native EventSource in browser.
// If using native EventSource, it sends cookies but not custom headers like Authorization.
// In this project we'll mount it and protect if possible, or handle auth differently.
// To keep it simple and working with fetch/EventSource:
router.get('/stream', streamNotifications);

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/clear', clearNotifications);
router.delete('/:id', deleteNotification);

module.exports = router;
