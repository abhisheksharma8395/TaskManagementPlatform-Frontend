/**
 * notificationService.js
 * Maps to notification-service endpoints (routed via API Gateway).
 *
 * Backend routes:
 *   GET  /notifications/my              → get all notifications for logged-in user
 *   GET  /notifications/my/unread       → get unread notifications
 *   GET  /notifications/my/unread-count → { count } — for badge display
 *   PUT  /notifications/{id}/read       → mark single notification as read
 *   PUT  /notifications/my/read-all     → mark all as read
 *   DELETE /notifications/my/read       → delete all read notifications
 *   DELETE /notifications/{id}          → delete a specific notification
 */
import api from './axiosInstance';

// Get all notifications for the logged-in user (newest first)
export const getMyNotifications = () =>
  api.get('/notification-service/notifications/my').then((r) => r.data);

// Get only unread notifications
export const getUnreadNotifications = () =>
  api.get('/notification-service/notifications/my/unread').then((r) => r.data);

// Get unread count — response: { count: Number }
export const getUnreadCount = () =>
  api.get('/notification-service/notifications/my/unread-count').then((r) => r.data);

export const sendNotification = (data) =>
  api.post('/notification-service/notifications', data).then((r) => r.data);

// Mark a single notification as read
export const markAsRead = (notificationId) =>
  api.put(`/notification-service/notifications/${notificationId}/read`).then((r) => r.data);

// Mark all notifications as read
export const markAllRead = () =>
  api.put('/notification-service/notifications/my/read-all').then((r) => r.data);

// Delete all read notifications
export const deleteReadNotifications = () =>
  api.delete('/notification-service/notifications/my/read').then((r) => r.data);

// Delete a specific notification
export const deleteNotification = (notificationId) =>
  api.delete(`/notification-service/notifications/${notificationId}`).then((r) => r.data);

// ─── NEW: Admin endpoints ─────────────────────────────────────────────────────

// Admin: get all notifications across all users
export const adminGetAllNotifications = () =>
  api.get('/notification-service/notifications/admin/all').then((r) => r.data);

// Admin: get notifications by recipient userId
export const adminGetNotificationsByRecipient = (userId) =>
  api.get(`/notification-service/notifications/recipient/${userId}`).then((r) => r.data);

export const sendBulkNotification = (data) =>
  api.post('/notification-service/notifications/bulk', data).then((r) => r.data);
