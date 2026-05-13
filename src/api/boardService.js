/**
 * boardService.js
 * Maps to board-service endpoints (routed via API Gateway).
 *
 * Backend routes:
 *   POST   /boards                          → create board
 *   GET    /boards/{boardId}                → get board
 *   GET    /boards/workspace/{workspaceId}  → get boards in workspace
 *   GET    /boards/member/{userId}          → get boards user is member of
 *   PUT    /boards/{boardId}                → update board
 *   PUT    /boards/{boardId}/close          → close board
 *   DELETE /boards/{boardId}                → delete board
 *   POST   /boards/{boardId}/members        → add member
 *   DELETE /boards/{boardId}/members/{userId} → remove member
 *   PUT    /boards/{boardId}/members/{userId}/role → update role
 *   GET    /boards/{boardId}/members        → list members
 *
 * BoardResponse fields: boardId, workspaceId, name, description,
 *   background, visibility, createdById, isClosed, memberCount, createdAt, updatedAt
 */
import api from './axiosInstance';

// Create a board. Required: workspaceId (Long), name. Optional: description, visibility
export const createBoard = (data) =>
  api.post('/board-service/boards', data).then((r) => r.data);

// Get a single board by ID
export const getBoard = (boardId) =>
  api.get(`/board-service/boards/${boardId}`).then((r) => r.data);

// Get all boards in a workspace
export const getBoardsByWorkspace = (workspaceId) =>
  api.get(`/board-service/boards/workspace/${workspaceId}`).then((r) => r.data);

// Get boards a specific user is a member of
export const getBoardsByMember = (userId) =>
  api.get(`/board-service/boards/member/${userId}`).then((r) => r.data);

// Update board details
export const updateBoard = (boardId, data) =>
  api.put(`/board-service/boards/${boardId}`, data).then((r) => r.data);

// Close/archive a board
export const closeBoard = (boardId) =>
  api.put(`/board-service/boards/${boardId}/close`).then((r) => r.data);

// Permanently delete a board
export const deleteBoard = (boardId) =>
  api.delete(`/board-service/boards/${boardId}`).then((r) => r.data);

// Add member to board: data { userId, role }
export const addBoardMember = (boardId, data) =>
  api.post(`/board-service/boards/${boardId}/members`, data).then((r) => r.data);

// Remove member from board
export const removeBoardMember = (boardId, userId) =>
  api.delete(`/board-service/boards/${boardId}/members/${userId}`).then((r) => r.data);

// List board members
export const getBoardMembers = (boardId) =>
  api.get(`/board-service/boards/${boardId}/members`).then((r) => r.data);

// Update a board member's role: data: { role: 'ADMIN'|'MEMBER' }
export const updateBoardMemberRole = (boardId, userId, data) =>
  api.put(`/board-service/boards/${boardId}/members/${userId}/role`, data).then((r) => r.data);

export const getAllBoards = () =>
  api.get('/board-service/boards/admin/all').then((r) => r.data);
