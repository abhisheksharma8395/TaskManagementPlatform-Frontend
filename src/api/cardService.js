/**
 * cardService.js
 * Maps to card-service endpoints (routed via API Gateway).
 *
 * Backend routes:
 *   POST   /cards                           → create card
 *   GET    /cards/{cardId}                  → get card by id
 *   GET    /cards/list/{listId}             → get cards in a list
 *   GET    /cards/board/{boardId}           → get all cards on a board
 *   GET    /cards/assignee/{userId}         → get cards assigned to user
 *   PUT    /cards/{cardId}                  → update card
 *   PUT    /cards/{cardId}/move             → move to different list { targetListId, position? }
 *   PUT    /cards/list/{listId}/reorder     → reorder cards in list
 *   PUT    /cards/{cardId}/assignee         → set assignee { assigneeId }
 *   PUT    /cards/{cardId}/priority         → set priority { priority: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL' }
 *   PUT    /cards/{cardId}/status           → set status { status: 'TO_DO'|'IN_PROGRESS'|'IN_REVIEW'|'DONE' }
 *   POST   /cards/{cardId}/archive          → archive card
 *   POST   /cards/{cardId}/unarchive        → restore card
 *   DELETE /cards/{cardId}                  → permanently delete archived card
 *   GET    /cards/board/{boardId}/overdue   → overdue cards for board
 *
 * CardResponse fields: cardId, listId, boardId, title, description, position,
 *   priority, status, dueDate, startDate, assigneeId, createdById, isArchived,
 *   isOverdue, coverColor, createdAt, updatedAt
 * NOTE: Backend uses `cardId` not `id`. Normalised in context to `id` via spread.
 */
import api from './axiosInstance';

// Create a card. Required: listId (Long), boardId (Long), title.
export const createCard = (data) =>
  api.post('/card-service/cards', data).then((r) => r.data);

// Get a single card by ID
export const getCard = (cardId) =>
  api.get(`/card-service/cards/${cardId}`).then((r) => r.data);

// Get all active cards in a list (ordered by position)
export const getCardsByList = (listId) =>
  api.get(`/card-service/cards/list/${listId}`).then((r) => r.data);

// Get all cards on a board
export const getCardsByBoard = (boardId) =>
  api.get(`/card-service/cards/board/${boardId}`).then((r) => r.data);

// Get cards assigned to a user
export const getCardsByAssignee = (userId) =>
  api.get(`/card-service/cards/assignee/${userId}`).then((r) => r.data);

// Update card details
export const updateCard = (cardId, data) =>
  api.put(`/card-service/cards/${cardId}`, data).then((r) => r.data);

// Move card to a different list (drag-and-drop)
// data: { targetListId: Long, position?: Integer }
export const moveCard = (cardId, data) =>
  api.put(`/card-service/cards/${cardId}/move`, data).then((r) => r.data);

// Set card assignee. data: { assigneeId: Long|null }
export const setAssignee = (cardId, data) =>
  api.put(`/card-service/cards/${cardId}/assignee`, data).then((r) => r.data);

// Set card priority. data: { priority: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL' }
export const setPriority = (cardId, data) =>
  api.put(`/card-service/cards/${cardId}/priority`, data).then((r) => r.data);

// Set card status. data: { status: 'TO_DO'|'IN_PROGRESS'|'IN_REVIEW'|'DONE' }
export const setStatus = (cardId, data) =>
  api.put(`/card-service/cards/${cardId}/status`, data).then((r) => r.data);

// Archive a card (soft delete)
export const archiveCard = (cardId) =>
  api.post(`/card-service/cards/${cardId}/archive`).then((r) => r.data);

// Permanently delete an archived card
export const deleteCard = (cardId) =>
  api.delete(`/card-service/cards/${cardId}`).then((r) => r.data);

// Get overdue cards for a board
export const getOverdueCards = (boardId) =>
  api.get(`/card-service/cards/board/${boardId}/overdue`).then((r) => r.data);

// ─── NEW: missing endpoints ───────────────────────────────────────────────────

// Restore an archived card
export const unarchiveCard = (cardId) =>
  api.post(`/card-service/cards/${cardId}/unarchive`).then((r) => r.data);

// Get all archived cards for a board
export const getArchivedCardsByBoard = (boardId) =>
  api.get(`/card-service/cards/board/${boardId}/archived`).then((r) => r.data);

// Reorder cards in a list (drag-and-drop persistence)
// data: { orderedCardIds: [Long, ...] }
export const reorderCards = (listId, data) =>
  api.put(`/card-service/cards/list/${listId}/reorder`, data).then((r) => r.data);
