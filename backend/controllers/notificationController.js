const {
  getAll,
  getById,
  updateById,
  deleteById,
  filter,
  create
} = require('../utils/firebaseHelpers');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    let notifications = await filter('notifications', (n) => n.recipient === userId);

    notifications = notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    let notifications = await filter('notifications', (n) => n.recipient === userId && !n.isRead);

    notifications = notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Get unread notifications error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await getById('notifications', id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.recipient !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const updated = await updateById('notifications', id, {
      isRead: true,
      readAt: Date.now()
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    let notifications = await filter('notifications', (n) => n.recipient === userId && !n.isRead);

    await Promise.all(
      notifications.map((n) =>
        updateById('notifications', n.id, {
          isRead: true,
          readAt: Date.now()
        })
      )
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await getById('notifications', id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.recipient !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await deleteById('notifications', id);
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    let notifications = await filter('notifications', (n) => n.recipient === userId);

    await Promise.all(notifications.map((n) => deleteById('notifications', n.id)));

    res.status(200).json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { recipient, sender, type, title, message, entityId, entityType } = req.body;

    if (!recipient || !sender || !type || !message) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    const notification = await create('notifications', {
      recipient,
      sender,
      type,
      title: title || '',
      message,
      entityId: entityId || null,
      entityType: entityType || null,
      isRead: false,
      createdAt: Date.now()
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await getById('notifications', id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.recipient !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
