import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Globe,
  LayoutDashboard,
  Plus,
  Settings,
  Share2,
  Shield,
  UserPlus,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import { canCreateBoard, canManageWorkspace, getBoardRole } from '../../utils/permissions';
import Avatar from '../Avatar/Avatar';
import { SkeletonSidebarItem } from '../SkeletonLoader/SkeletonLoader';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isPlatformAdmin } = useAuth();
  const {
    workspaces,
    boards,
    assignedBoards,
    extraWorkspacesById,
    activeWorkspaceId,
    setActiveWorkspaceId,
    fetchBoards,
    createWorkspace,
    addBoard,
    inviteMember,
    fetchWorkspaceMembers,
    removeWorkspaceMember,
    updateWorkspaceMemberRole,
    getCachedWorkspaceMembers,
    getCachedBoardMembers,
    loadingBoards,
    loadingAssigned,
  } = useBoard();

  const [boardsExpanded, setBoardsExpanded] = useState(true);
  const [sharedBoardsExpanded, setSharedBoardsExpanded] = useState(true);
  const [sharedWorkspacesExpanded, setSharedWorkspacesExpanded] = useState(false);
  const [showWorkspaceList, setShowWorkspaceList] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [addingBoard, setAddingBoard] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === String(activeWorkspaceId)) || workspaces[0] || null,
    [activeWorkspaceId, workspaces],
  );

  const workspaceMembers = getCachedWorkspaceMembers(activeWorkspace?.id);

  // Boards in the active workspace (owned/member workspaces)
  const visibleBoards = useMemo(
    () => boards.filter((board) => board.workspaceId === String(activeWorkspace?.id)),
    [activeWorkspace?.id, boards],
  );

  // "Shared With Me" boards: assigned boards that are NOT in any of the user's workspaces
  // This catches boards from private workspaces the user doesn't own/belong to as workspace-level member
  const ownWorkspaceIds = useMemo(
    () => new Set(workspaces.map((ws) => String(ws.id))),
    [workspaces],
  );

  const sharedWithMeBoards = useMemo(() => {
    if (!assignedBoards?.length) return [];
    // De-dupe: only show if not already visible in an owned workspace
    const seen = new Set();
    return assignedBoards.filter((board) => {
      if (seen.has(board.id)) return false;
      seen.add(board.id);
      // Show if from a workspace the user is NOT a member/owner of
      // OR if they're added directly to this board but this workspace's boards aren't in sidebar
      const inOwnedWs = ownWorkspaceIds.has(String(board.workspaceId));
      // Still show if in a shared workspace (workspaceMember) so user can navigate directly
      return true; // Show all assigned boards — we'll deduplicate display below
    });
  }, [assignedBoards, ownWorkspaceIds]);

  // Boards to show in "Shared With Me": assigned boards that are NOT in current active workspace
  const sharedNotInActive = useMemo(() => {
    const activeWsId = String(activeWorkspace?.id);
    const visibleIds = new Set(visibleBoards.map((b) => b.id));
    return sharedWithMeBoards.filter((b) => !visibleIds.has(b.id));
  }, [sharedWithMeBoards, visibleBoards, activeWorkspace?.id]);

  // Shared workspaces: workspaces where user is member but NOT owner
  const sharedWorkspaces = useMemo(
    () => workspaces.filter((ws) => String(ws.ownerId) !== String(user?.userId)),
    [workspaces, user?.userId],
  );

  const mayCreateBoards = canCreateBoard(user, activeWorkspace, workspaceMembers);
  const mayManageWorkspace = canManageWorkspace(user, activeWorkspace, workspaceMembers);

  const handleWorkspaceChange = async (workspaceId) => {
    setActiveWorkspaceId(String(workspaceId));
    await fetchBoards(workspaceId);
    navigate(`/workspaces/${workspaceId}`);
    setShowWorkspaceList(false);
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    const created = await createWorkspace({ name: workspaceName.trim(), visibility: 'PRIVATE' });
    setWorkspaceName('');
    setCreatingWorkspace(false);
    setShowWorkspaceList(false);
    navigate(`/workspaces/${created.id}`);
  };

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;
    const created = await addBoard({ name: boardName.trim(), visibility: 'PRIVATE' });
    setBoardName('');
    setAddingBoard(false);
    navigate(`/boards/${created.id}`);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !activeWorkspace?.id) return;
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      await inviteMember(activeWorkspace.id, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setInviteSuccess(`${inviteEmail.trim()} added as ${inviteRole}`);
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch (error) {
      setInviteError(error.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleOpenMembers = async () => {
    setShowMembers(true);
    if (workspaceMembers.length === 0) {
      setMembersLoading(true);
      try { await fetchWorkspaceMembers(activeWorkspace.id); }
      finally { setMembersLoading(false); }
    }
  };

  const getBoardBackground = (board) => {
    const bg = board.background;
    if (!bg) return 'linear-gradient(135deg, #f97316, #fb7185)';
    if (bg.startsWith('#') || bg.startsWith('linear')) return bg;
    return `url(${bg}) center/cover`;
  };

  return (
    <aside className={styles.sidebar}>
      <button className={styles.workspace} onClick={() => setShowWorkspaceList((value) => !value)}>
        <div className={styles.workspaceIcon}>
          <Building2 size={18} />
        </div>
        <div className={styles.workspaceInfo}>
          <span className={styles.workspaceName}>{activeWorkspace?.name || 'Choose workspace'}</span>
          <span className={styles.workspaceTeam}>{user?.email || 'flowboard'}</span>
        </div>
        <div className={styles.wsChevron}>
          <ChevronDown size={14} />
        </div>
      </button>

      {showWorkspaceList && (
        <div className={styles.wsSwitcher}>
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              className={`${styles.wsItem} ${workspace.id === String(activeWorkspace?.id) ? styles.wsActive : ''}`}
              onClick={() => handleWorkspaceChange(workspace.id)}
            >
              <div className={styles.wsItemIcon}>
                <Building2 size={14} />
              </div>
              <div className={styles.wsItemContent}>
                <span className={styles.wsItemName}>{workspace.name}</span>
                {workspace.ownerName && (
                  <span className={styles.wsItemOwner}>{String(workspace.ownerId) === String(user?.userId) ? 'You' : workspace.ownerName}</span>
                )}
              </div>
            </button>
          ))}
          {creatingWorkspace ? (
            <div className={styles.newWsForm}>
              <input
                className={styles.addBoardInput}
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Workspace name"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleCreateWorkspace();
                }}
              />
              <div className={styles.wsFormActions}>
                <button className={styles.wsSaveBtn} onClick={handleCreateWorkspace}>Create</button>
                <button className={styles.wsCancelBtn} onClick={() => setCreatingWorkspace(false)}>X</button>
              </div>
            </div>
          ) : (
            <button className={styles.createWsBtn} onClick={() => setCreatingWorkspace(true)}>
              <Plus size={13} />
              Create Workspace
            </button>
          )}
        </div>
      )}

      {mayManageWorkspace && (
        <button className={styles.inviteBtn} onClick={() => setShowInviteModal(true)}>
          <UserPlus size={14} />
          Invite Member
        </button>
      )}

      <nav className={styles.nav}>
        <Link to="/dashboard" className={`${styles.navItem} ${location.pathname === '/dashboard' ? styles.active : ''}`}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </Link>

        <Link to="/public-dashboard" className={`${styles.navItem} ${location.pathname === '/public-dashboard' ? styles.active : ''}`}>
          <Globe size={16} />
          <span>Public Dashboard</span>
        </Link>

        {/* ── Boards section ──────────────────────────────────────────────── */}
        <div className={styles.sectionHeader}>
          <button className={styles.sectionToggle} onClick={() => setBoardsExpanded((value) => !value)}>
            {boardsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Boards</span>
          </button>
          {mayCreateBoards && (
            <button className={styles.addItemBtn} onClick={() => setAddingBoard((value) => !value)}>
              <Plus size={14} />
            </button>
          )}
        </div>

        {addingBoard && (
          <div className={styles.addBoardForm}>
            <input
              className={styles.addBoardInput}
              value={boardName}
              onChange={(event) => setBoardName(event.target.value)}
              placeholder="Board name"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreateBoard();
              }}
            />
            <div className={styles.wsFormActions}>
              <button className={styles.wsSaveBtn} onClick={handleCreateBoard}>Add</button>
              <button className={styles.wsCancelBtn} onClick={() => setAddingBoard(false)}>X</button>
            </div>
          </div>
        )}

        {boardsExpanded && loadingBoards && (
          <>
            <SkeletonSidebarItem />
            <SkeletonSidebarItem />
            <SkeletonSidebarItem />
          </>
        )}

        {boardsExpanded && !loadingBoards && visibleBoards.length === 0 && (
          <div className={styles.emptySection}>No boards yet</div>
        )}

        {boardsExpanded && visibleBoards.map((board) => (
          <Link
            key={board.id}
            to={`/boards/${board.id}`}
            className={`${styles.navItem} ${styles.boardItem} ${location.pathname === `/boards/${board.id}` ? styles.active : ''}`}
          >
            <span className={styles.boardThumb} style={{ background: getBoardBackground(board) }} />
            <span className={styles.boardName}>{board.name}</span>
            {board.isClosed && <span className={styles.closedTag}>closed</span>}
          </Link>
        ))}

        {/* ── Shared With Me section ──────────────────────────────────────── */}
        {(sharedNotInActive.length > 0 || loadingAssigned) && (
          <>
            <div className={styles.sectionHeader}>
              <button className={styles.sectionToggle} onClick={() => setSharedBoardsExpanded((v) => !v)}>
                {sharedBoardsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Share2 size={12} />
                <span>Shared With Me</span>
              </button>
            </div>

            {sharedBoardsExpanded && loadingAssigned && !sharedNotInActive.length && (
              <div className={styles.emptySection} style={{ color: '#9ca3af', fontSize: 12 }}>Loading…</div>
            )}

            {sharedBoardsExpanded && sharedNotInActive.map((board) => {
              const isPrivate = board.visibility === 'PRIVATE';
              // Resolve workspace name: check user's own workspaces first, then extraWorkspacesById
              const ws = workspaces.find((w) => String(w.id) === String(board.workspaceId))
                || extraWorkspacesById?.[String(board.workspaceId)];
              const wsName = ws?.name || null;
              return (
                <Link
                  key={`shared-${board.id}`}
                  to={`/boards/${board.id}`}
                  className={`${styles.navItem} ${styles.boardItem} ${location.pathname === `/boards/${board.id}` ? styles.active : ''}`}
                >
                  <span className={styles.boardThumb} style={{ background: getBoardBackground(board) }} />
                  <div className={styles.boardItemInfo}>
                    <span className={styles.boardName}>{board.name}</span>
                    <span className={styles.boardWsLabel}>
                      {isPrivate && <Lock size={9} style={{ display: 'inline', marginRight: 2 }} />}
                      {wsName || <span style={{ fontStyle: 'italic' }}>Loading…</span>}
                    </span>
                  </div>
                </Link>
              );
            })}

            {sharedBoardsExpanded && !loadingAssigned && sharedNotInActive.length === 0 && (
              <div className={styles.emptySection}>No shared boards</div>
            )}
          </>
        )}

        {/* ── Shared Workspaces section ───────────────────────────────────── */}
        {sharedWorkspaces.length > 0 && (
          <>
            <div className={styles.sectionHeader}>
              <button className={styles.sectionToggle} onClick={() => setSharedWorkspacesExpanded((v) => !v)}>
                {sharedWorkspacesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Building2 size={12} />
                <span>Shared Workspaces</span>
              </button>
            </div>

            {sharedWorkspacesExpanded && sharedWorkspaces.map((ws) => (
              <Link
                key={`shared-ws-${ws.id}`}
                to={`/workspaces/${ws.id}`}
                className={`${styles.navItem} ${styles.boardItem} ${location.pathname === `/workspaces/${ws.id}` ? styles.active : ''}`}
              >
                <div className={styles.wsItemIcon} style={{ width: 18, height: 18, borderRadius: 5 }}>
                  <Building2 size={10} />
                </div>
                <div className={styles.boardItemInfo}>
                  <span className={styles.boardName}>{ws.name}</span>
                  <span className={styles.boardRole}>by {ws.ownerName || 'Unknown'}</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className={styles.bottomNav}>
        {isPlatformAdmin && (
          <Link to="/admin" className={`${styles.navItem} ${location.pathname === '/admin' ? styles.active : ''}`}>
            <Shield size={16} />
            <span>Admin</span>
          </Link>
        )}
        <Link to="/settings" className={`${styles.navItem} ${location.pathname === '/settings' ? styles.active : ''}`}>
          <Settings size={16} />
          <span>Settings</span>
        </Link>
      </div>

      {showInviteModal && createPortal(
        <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Invite Member</h3>
              <button className={styles.modalClose} onClick={() => setShowInviteModal(false)}>×</button>
            </div>
            <p>Add a teammate to <strong>{activeWorkspace?.name}</strong>.</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <input
                type="email"
                className={styles.modalInput}
                style={{ marginBottom: 0, flex: 1 }}
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@company.com"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{ padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {inviteError && <p className={styles.inviteError}>{inviteError}</p>}
            {inviteSuccess && <p style={{ fontSize: 12, color: '#10b981', margin: '4px 0 0' }}>{inviteSuccess}</p>}

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleInvite} disabled={inviting}>
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>

            {/* Member list */}
            <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members</span>
                <button onClick={handleOpenMembers} style={{ fontSize: 11, color: '#0f766e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Refresh</button>
              </div>
              {membersLoading && <p style={{ fontSize: 12, color: '#9ca3af' }}>Loading...</p>}
              {workspaceMembers.map((m) => (
                <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f9fafb' }}>
                  <Avatar src={m.avatarUrl} fullName={m.fullName} username={m.username} userId={m.userId} size="xs" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.fullName || m.username}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{m.email}</div>
                  </div>
                  {mayManageWorkspace && String(m.userId) !== String(activeWorkspace?.ownerId) ? (
                    <>
                      <select
                        value={m.role || 'MEMBER'}
                        onChange={(e) => updateWorkspaceMemberRole(activeWorkspace.id, m.userId, e.target.value)}
                        style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'inherit', cursor: 'pointer' }}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={() => removeWorkspaceMember(activeWorkspace.id, m.userId)}
                        title="Remove"
                        style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 14, lineHeight: 1, borderRadius: 4, padding: 2, transition: 'color 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#d1d5db'; }}
                      >×</button>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '1px 7px', borderRadius: 10 }}>
                      {String(m.userId) === String(activeWorkspace?.ownerId) ? 'Owner' : m.role || 'Member'}
                    </span>
                  )}
                </div>
              ))}
              {workspaceMembers.length === 0 && !membersLoading && (
                <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>No members yet</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}
