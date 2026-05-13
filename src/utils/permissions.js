// ── Centralized permission utilities ─────────────────────────────────────────
// Every role check in the app should go through these functions.
// Roles hierarchy: OWNER > ADMIN > MEMBER > GUEST

export const PLATFORM_ROLE = {
  MEMBER: 'MEMBER',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
};

export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'];
export const BOARD_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'OBSERVER', 'GUEST'];

export function decodeJwtClaims(token) {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function normalizePlatformRole(role) {
  return String(role || '').toUpperCase() === 'ADMIN'
    ? PLATFORM_ROLE.PLATFORM_ADMIN
    : PLATFORM_ROLE.MEMBER;
}

export function getWorkspaceRole(workspace, members, userId) {
  if (!workspace || !userId) return 'GUEST';
  if (String(workspace.ownerId) === String(userId)) return 'OWNER';

  const member = (members || []).find((item) => String(item.userId) === String(userId));
  return member?.role?.toUpperCase() || 'GUEST';
}

export function getBoardRole(board, members, userId) {
  if (!board || !userId) return 'GUEST';
  if (String(board.createdById) === String(userId)) return 'OWNER';

  const member = (members || []).find((item) => String(item.userId) === String(userId));
  return member?.role?.toUpperCase() || 'GUEST';
}

export function isPlatformAdmin(user) {
  return normalizePlatformRole(user?.role) === PLATFORM_ROLE.PLATFORM_ADMIN;
}

// ── Workspace permissions ────────────────────────────────────────────────────

export function canManageWorkspace(user, workspace, members) {
  if (isPlatformAdmin(user)) return true;
  const role = getWorkspaceRole(workspace, members, user?.userId);
  return role === 'OWNER' || role === 'ADMIN';
}

export function canDeleteWorkspace(user, workspace, members) {
  if (isPlatformAdmin(user)) return true;
  const role = getWorkspaceRole(workspace, members, user?.userId);
  return role === 'OWNER';
}

export function canInviteMembers(user, workspace, members) {
  if (isPlatformAdmin(user)) return true;
  const role = getWorkspaceRole(workspace, members, user?.userId);
  return role === 'OWNER' || role === 'ADMIN';
}

export function canManageMembers(user, workspace, members) {
  if (isPlatformAdmin(user)) return true;
  const role = getWorkspaceRole(workspace, members, user?.userId);
  return role === 'OWNER' || role === 'ADMIN';
}

export function canEditWorkspace(user, workspace, members) {
  if (isPlatformAdmin(user)) return true;
  const role = getWorkspaceRole(workspace, members, user?.userId);
  return role === 'OWNER' || role === 'ADMIN';
}

export function canLeaveWorkspace(user, workspace, members) {
  if (!user || !workspace) return false;
  const role = getWorkspaceRole(workspace, members, user?.userId);
  return role !== 'OWNER' && role !== 'GUEST';
}

export function canCreateBoard(user, workspace, members) {
  if (!user || !workspace) return false;
  if (isPlatformAdmin(user)) return true;
  return getWorkspaceRole(workspace, members, user.userId) !== 'GUEST';
}

// ── Board permissions ────────────────────────────────────────────────────────

export function canManageBoard(user, board, members) {
  if (isPlatformAdmin(user)) return true;
  const role = getBoardRole(board, members, user?.userId);
  return role === 'OWNER' || role === 'ADMIN';
}

export function canEditBoard(user, board, members) {
  if (isPlatformAdmin(user)) return true;
  const role = getBoardRole(board, members, user?.userId);
  return role === 'OWNER' || role === 'ADMIN';
}

export function canDeleteBoard(user, board, members) {
  if (isPlatformAdmin(user)) return true;
  const role = getBoardRole(board, members, user?.userId);
  return role === 'OWNER' || role === 'ADMIN';
}

export function canCollaborateOnBoard(user, board, members) {
  if (!user || !board) return false;
  if (isPlatformAdmin(user)) return true;
  const role = getBoardRole(board, members, user.userId);
  return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
}

export function isGuestOnBoard(user, board, members) {
  if (!user || !board) return true;
  if (isPlatformAdmin(user)) return false;
  const role = getBoardRole(board, members, user.userId);
  return role === 'GUEST' || role === 'OBSERVER';
}

export function canEditComment(user, comment) {
  if (!user || !comment) return false;
  if (isPlatformAdmin(user)) return true;
  return String(comment.authorId) === String(user.userId);
}

// ── Utility: get a human-readable role label ─────────────────────────────────
export function getRoleLabel(role) {
  const labels = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MEMBER: 'Member',
    OBSERVER: 'Observer',
    GUEST: 'Guest',
  };
  return labels[role?.toUpperCase()] || 'Guest';
}

export function getRoleBadgeColor(role) {
  const colors = {
    OWNER: { bg: '#fef3c7', color: '#92400e' },
    ADMIN: { bg: '#ede9fe', color: '#6d28d9' },
    MEMBER: { bg: '#d1fae5', color: '#065f46' },
    OBSERVER: { bg: '#e5e7eb', color: '#374151' },
    GUEST: { bg: '#f3f4f6', color: '#6b7280' },
  };
  return colors[role?.toUpperCase()] || colors.GUEST;
}
