import api from './axiosInstance';

// Create a list. Required: boardId (Long), name. Optional: color
export const createList = (data) =>
  api.post('/list-service/lists', data).then((r) => r.data);

// Get a single list by ID
export const getList = (listId) =>
  api.get(`/list-service/lists/${listId}`).then((r) => r.data);

// Get all active lists for a board (ordered by position)
export const getListsByBoard = (boardId) =>
  api.get(`/list-service/lists/board/${boardId}`).then((r) => r.data);

// Update list name or color. data: { name?, color? }
export const updateList = (listId, data) =>
  api.put(`/list-service/lists/${listId}`, data).then((r) => r.data);

// Archive a list (soft delete)
export const archiveList = (listId) =>
  api.post(`/list-service/lists/${listId}/archive`).then((r) => r.data);

// Permanently delete an archived list
export const deleteList = (listId) =>
  api.delete(`/list-service/lists/${listId}`).then((r) => r.data);

// Reorder lists on a board (drag-and-drop)
// data: { orderedListIds: [Long, Long, ...] }
export const reorderLists = (boardId, data) =>
  api.put(`/list-service/lists/board/${boardId}/reorder`, data).then((r) => r.data);

// ─── NEW: missing endpoints ───────────────────────────────────────────────────

// Restore an archived list
export const unarchiveList = (listId) =>
  api.post(`/list-service/lists/${listId}/unarchive`).then((r) => r.data);

// Get archived lists for a board
export const getArchivedListsByBoard = (boardId) =>
  api.get(`/list-service/lists/board/${boardId}/archived`).then((r) => r.data);

// Move list to a different board: data: { targetBoardId: Long, position?: Integer }
export const moveList = (listId, data) =>
  api.put(`/list-service/lists/${listId}/move`, data).then((r) => r.data);
