/**
 * labelService.js  (NEW FILE)
 * Maps to label-service endpoints (routed via API Gateway).
 *
 * Backend routes:
 *   POST   /labels                              → create label { boardId, name, color }
 *   GET    /labels/board/{boardId}              → get labels for board
 *   GET    /labels/{labelId}                    → get label by id
 *   PUT    /labels/{labelId}                    → update label { name?, color? }
 *   DELETE /labels/{labelId}                    → delete label
 *   POST   /labels/card                         → attach label to card { cardId, labelId }
 *   DELETE /labels/card/{cardId}/label/{labelId} → remove label from card
 *   GET    /labels/card/{cardId}                → get labels on card
 *   POST   /checklists                          → create checklist { cardId, title }
 *   GET    /checklists/{checklistId}            → get checklist
 *   GET    /checklists/card/{cardId}            → get checklists for card
 *   DELETE /checklists/{checklistId}            → delete checklist
 *   GET    /checklists/{checklistId}/progress   → get progress (0-100)
 *   POST   /checklists/{checklistId}/items      → add item { title }
 *   PUT    /checklists/items/{itemId}/toggle    → toggle item complete
 *   DELETE /checklists/items/{itemId}           → delete item
 */
import api from './axiosInstance';

// ─── Labels ──────────────────────────────────────────────────────────────────

// Create a label for a board. data: { boardId, name, color }
export const createLabel = (data) =>
  api.post('/label-service/labels', data).then((r) => r.data);

// Get labels for a board
export const getLabelsByBoard = (boardId) =>
  api.get(`/label-service/labels/board/${boardId}`).then((r) => r.data);

// Update label. data: { name?, color? }
export const updateLabel = (labelId, data) =>
  api.put(`/label-service/labels/${labelId}`, data).then((r) => r.data);

// Delete a label (removes it from all cards too)
export const deleteLabel = (labelId) =>
  api.delete(`/label-service/labels/${labelId}`).then((r) => r.data);

// Attach a label to a card. data: { cardId, labelId }
export const addLabelToCard = (data) =>
  api.post('/label-service/labels/card', data).then((r) => r.data);

// Remove label from card
export const removeLabelFromCard = (cardId, labelId) =>
  api.delete(`/label-service/labels/card/${cardId}/label/${labelId}`).then((r) => r.data);

// Get labels attached to a card
export const getLabelsForCard = (cardId) =>
  api.get(`/label-service/labels/card/${cardId}`).then((r) => r.data);

// ─── Checklists ──────────────────────────────────────────────────────────────

// Create a checklist on a card. data: { cardId, title }
export const createChecklist = (data) =>
  api.post('/label-service/checklists', data).then((r) => r.data);

// Get checklists for a card
export const getChecklistsByCard = (cardId) =>
  api.get(`/label-service/checklists/card/${cardId}`).then((r) => r.data);

// Delete a checklist
export const deleteChecklist = (checklistId) =>
  api.delete(`/label-service/checklists/${checklistId}`).then((r) => r.data);

// Get checklist completion % (0-100)
export const getChecklistProgress = (checklistId) =>
  api.get(`/label-service/checklists/${checklistId}/progress`).then((r) => r.data);

// Add an item to a checklist. data: { title }
export const addChecklistItem = (checklistId, data) =>
  api.post(`/label-service/checklists/${checklistId}/items`, data).then((r) => r.data);

// Toggle checklist item complete/incomplete
export const toggleChecklistItem = (itemId) =>
  api.put(`/label-service/checklists/items/${itemId}/toggle`).then((r) => r.data);

// Delete a checklist item
export const deleteChecklistItem = (itemId) =>
  api.delete(`/label-service/checklists/items/${itemId}`).then((r) => r.data);
