import api from './axiosInstance';

export const login = ({ username, password }) =>
  api.post('/auth-service/auth/login', { username, password }).then((r) => r.data);

export const register = ({ userName, fullName, email, password, role = 'USER' }) =>
  api.post('/auth-service/auth/register', { userName, fullName, email, password, role }).then((r) => r.data);

export const getUserByUsername = (username) =>
  api.get(`/auth-service/auth/user/username/${username}`).then((r) => r.data);

export const getUserById = (userId) =>
  api.get(`/auth-service/auth/user/id/${userId}`).then((r) => r.data);

export const getUserByEmail = (email) =>
  api.get(`/auth-service/auth/user/email/${encodeURIComponent(email)}`).then((r) => r.data);

export const searchUsersByName = (fullName) =>
  api.get('/auth-service/auth/search/name', { params: { fullName } }).then((r) => r.data);

/** NEW — admin: search users by role ('USER' | 'ADMIN') */
export const searchUsersByRole = (role) =>
  api.get(`/auth-service/auth/search/role/${role}`).then((r) => r.data);


export const changePassword = ({ username, oldPassword, newPassword }) =>
  api.get('/auth-service/auth/update/password', {
    params: { username, oldPassword, newPassword },
  }).then((r) => r.data);

export const forgotPassword = ({ email }) =>
  api.post('/auth-service/auth/forgot-password', null, {
    params: { email },
  }).then((r) => r.data);

export const resetPassword = ({ email, otp, newPassword }) =>
  api.post('/auth-service/auth/reset-password', null, {
    params: { email, otp, newPassword },
  }).then((r) => r.data);

/** NEW — Deactivate (soft-delete) a user account */
export const deactivateAccount = (userId) =>
  api.patch(`/auth-service/auth/deactivate/${userId}`).then((r) => r.data);

export const uploadAvatar = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/auth-service/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }).then((r) => r.data);
};
