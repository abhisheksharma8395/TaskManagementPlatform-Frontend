import api from './axiosInstance';

// Create a new workspace. Required: name. Optional: description, visibility ('PUBLIC'|'PRIVATE')
export const createWorkspace = (data) =>
  api.post('/workspace-service/workspaces', data).then((r) => r.data);

// Fetch a single workspace by its ID
export const getWorkspace = (workspaceId) =>
  api.get(`/workspace-service/workspaces/${workspaceId}`).then((r) => r.data);

// Get all workspaces owned by a user
export const getWorkspacesByOwner = (ownerId) =>
  api.get(`/workspace-service/workspaces/owner/${ownerId}`).then((r) => r.data);

// Get all workspaces a user is a member of
export const getWorkspacesByMember = (userId) =>
  api.get(`/workspace-service/workspaces/member/${userId}`).then((r) => r.data);

// Update workspace name/description/visibility
export const updateWorkspace = (workspaceId, data) =>
  api.put(`/workspace-service/workspaces/${workspaceId}`, data).then((r) => r.data);

// Delete a workspace (owner only)
export const deleteWorkspace = (workspaceId) =>
  api.delete(`/workspace-service/workspaces/${workspaceId}`).then((r) => r.data);

// Add a member by email
// data: { userId: Long, role: 'ADMIN'|'MEMBER' }
export const addMember = (workspaceId, data) =>
  api.post(`/workspace-service/workspaces/${workspaceId}/members`, data).then((r) => r.data);

// Remove a member from workspace
export const removeMember = (workspaceId, userId) =>
  api.delete(`/workspace-service/workspaces/${workspaceId}/members/${userId}`).then((r) => r.data);

// Update a member's role: data: { role: 'ADMIN'|'MEMBER' }
export const updateMemberRole = (workspaceId, userId, data) =>
  api.put(`/workspace-service/workspaces/${workspaceId}/members/${userId}/role`, data).then((r) => r.data);

// List all members of a workspace
export const getMembers = (workspaceId) =>
  api.get(`/workspace-service/workspaces/${workspaceId}/members`).then((r) => r.data);

// List all public workspaces
export const getPublicWorkspaces = () =>
  api.get('/workspace-service/workspaces/public').then((r) => r.data);

export const getAllWorkspaces = () =>
  api.get('/workspace-service/workspaces/admin/all').then((r) => r.data);
