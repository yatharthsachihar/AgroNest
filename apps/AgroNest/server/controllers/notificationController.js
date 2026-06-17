const Notification = require('../models/Notification');
const sseManager = require('../utils/sse');

// @desc    Establish SSE connection for real-time notifications
// @route   GET /api/notifications/stream
// @access  Private/Admin
const streamNotifications = (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Tell proxy to send headers immediately

  // Send an initial ping to establish connection
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Add this client to our SSE manager
  sseManager.addClient(res);
};

// @desc    Get all notifications (paginated)
// @route   GET /api/notifications
// @access  Private/Admin
const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get count of unread notifications
    const unreadCount = await Notification.countDocuments({ read: false });

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private/Admin
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private/Admin
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear
// @access  Private/Admin
const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  streamNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications
};
