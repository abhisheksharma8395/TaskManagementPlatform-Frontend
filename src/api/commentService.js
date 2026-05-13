/**
 * commentService.js  (NEW FILE)
 * Maps to comment-service endpoints (routed via API Gateway).
 *
 * Backend routes:
 *   POST   /comments                        → add comment { cardId, content, parentCommentId? }
 *   GET    /comments/card/{cardId}          → get top-level comments for card
 *   GET    /comments/{commentId}            → get comment by id
 *   GET    /comments/{commentId}/replies    → get replies
 *   GET    /comments/card/{cardId}/count    → get comment count
 *   PUT    /comments/{commentId}            → edit comment { content }
 *   DELETE /comments/{commentId}            → soft-delete comment
 *   POST   /attachments                     → add attachment { cardId, fileUrl, fileName, fileSize }
 *   GET    /attachments/card/{cardId}       → get attachments for card
 *   DELETE /attachments/{attachmentId}      → delete attachment
 */
import api from './axiosInstance';

// Add a comment to a card. data: { cardId, content, parentCommentId? }
export const addComment = (data) =>
  api.post('/comment-service/comments', data).then((r) => r.data);

// Get all comments for a card
export const getCommentsByCard = (cardId) =>
  api.get(`/comment-service/comments/card/${cardId}`).then((r) => r.data);

// Get replies to a comment
export const getReplies = (commentId) =>
  api.get(`/comment-service/comments/${commentId}/replies`).then((r) => r.data);

// Get comment count for a card
export const getCommentCount = (cardId) =>
  api.get(`/comment-service/comments/card/${cardId}/count`).then((r) => r.data);

// Edit a comment. data: { content }
export const updateComment = (commentId, data) =>
  api.put(`/comment-service/comments/${commentId}`, data).then((r) => r.data);

// Soft-delete a comment
export const deleteComment = (commentId) =>
  api.delete(`/comment-service/comments/${commentId}`).then((r) => r.data);

// Add an attachment. data: { cardId, fileUrl, fileName, fileSize? }
export const addAttachment = (data) =>
  api.post('/comment-service/attachments', data).then((r) => r.data);

export const uploadAttachment = ({ cardId, file }, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cardId', cardId);

  return api.post('/comment-service/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }).then((r) => r.data);
};

export const uploadAttachments = async ({ cardId, files }, onFileProgress) => {
  const uploaded = [];

  for (const file of files) {
    const attachment = await uploadAttachment({ cardId, file }, (event) => {
      if (!event.total) return;
      onFileProgress?.(file.name, Math.round((event.loaded * 100) / event.total));
    });
    uploaded.push(attachment);
  }

  return uploaded;
};

// Get all attachments for a card
export const getAttachmentsByCard = (cardId) =>
  api.get(`/comment-service/attachments/card/${cardId}`).then((r) => r.data);

// Delete an attachment
export const deleteAttachment = (attachmentId) =>
  api.delete(`/comment-service/attachments/${attachmentId}`).then((r) => r.data);
