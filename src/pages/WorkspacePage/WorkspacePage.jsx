import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, KanbanSquare, Users, Lock, Globe, X, UserMinus, Edit2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import {
  canCreateBoard,
  canManageWorkspace,
  canManageMembers,
  getWorkspaceRole,
  getRoleLabel,
  getRoleBadgeColor,
} from '../../utils/permissions';
import Avatar, { AvatarStack } from '../../components/Avatar/Avatar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { SkeletonCard, SkeletonRow } from '../../components/SkeletonLoader/SkeletonLoader';
import styles from './WorkspacePage.module.css';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const {
    workspaces,
    publicWorkspaces,
    boards,
    setActiveWorkspaceId,
    fetchBoards,
    fetchWorkspaceMembers,
    addBoard,
    updateWorkspace,
    removeWorkspaceMember,
    updateWorkspaceMemberRole,
    getCachedWorkspaceMembers,
    loadingBoards,
  } = useBoard();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', background: '', visibility: 'PRIVATE' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  // Edit workspace modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', visibility: 'PRIVATE' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSaved, setEditSaved] = useState(false);

  // Confirm modal for removing a member
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);

  const workspace = useMemo(
    () => workspaces.find((item) => item.id === String(workspaceId))
      || publicWorkspaces.find((item) => item.id === String(workspaceId))
      || null,
    [publicWorkspaces, workspaceId, workspaces],
  );
  const workspaceMembers = getCachedWorkspaceMembers(workspaceId);
  const workspaceBoards = useMemo(
    () => boards.filter((board) => board.workspaceId === String(workspaceId)),
    [boards, workspaceId],
  );

  useEffect(() => {
    if (!workspaceId) return;
    setActiveWorkspaceId(String(workspaceId));
    fetchBoards(workspaceId);
    fetchWorkspaceMembers(workspaceId).catch(() => {});
  }, [fetchBoards, fetchWorkspaceMembers, setActiveWorkspaceId, workspaceId]);

  // Sync edit form when workspace changes
  useEffect(() => {
    if (workspace) {
      setEditForm({
        name: workspace.name || '',
        description: workspace.description || '',
        visibility: workspace.visibility || 'PRIVATE',
      });
    }
  }, [workspace]);

  const canCreate = canCreateBoard(user, workspace, workspaceMembers);
  const canManage = canManageWorkspace(user, workspace, workspaceMembers);
  const canManageMembersRole = canManageMembers(user, workspace, workspaceMembers);
  const currentUserRole = getWorkspaceRole(workspace, workspaceMembers, user?.userId);
  const isGuest = currentUserRole === 'GUEST';

  const handleCreateBoard = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError('');
    try {
      await addBoard({
        name: form.name.trim(),
        description: form.description.trim(),
        background: form.background.trim(),
        visibility: form.visibility,
      });
      setForm({ name: '', description: '', background: '', visibility: 'PRIVATE' });
      setShowForm(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to create board');
    } finally {
      setSaving(false);
    }
  };

  const handleEditWorkspace = async (event) => {
    event.preventDefault();
    if (!editForm.name.trim()) { setEditError('Name is required'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      await updateWorkspace(workspaceId, {
        name: editForm.name.trim(),
        description: editForm.description,
        visibility: editForm.visibility,
      });
      setEditSaved(true);
      setTimeout(() => { setEditSaved(false); setShowEditModal(false); }, 1200);
    } catch (e) {
      setEditError(e?.response?.data?.message || 'Failed to update workspace');
    } finally {
      setEditSaving(false);
    }
  };

  const handleOpenMembers = async () => {
    setShowMembersPanel(true);
    if (workspaceMembers.length === 0) {
      setMembersLoading(true);
      try {
        await fetchWorkspaceMembers(workspaceId);
      } finally {
        setMembersLoading(false);
      }
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemoveMember) return;
    setRemovingMember(true);
    try {
      await removeWorkspaceMember(workspaceId, confirmRemoveMember.userId);
    } finally {
      setRemovingMember(false);
      setConfirmRemoveMember(null);
    }
  };

  const handleRoleChange = async (memberId, role) => {
    await updateWorkspaceMemberRole(workspaceId, memberId, role);
  };

  if (!workspace) {
    return (
      <div className={styles.emptyState}>
        <h2>Workspace not found</h2>
        <p>The selected workspace is unavailable or you do not have access to it.</p>
      </div>
    );
  }

  const roleBadgeStyle = getRoleBadgeColor(currentUserRole);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.badges}>
            <span className={styles.badge}>
              {workspace.visibility === 'PUBLIC' ? <Globe size={13} /> : <Lock size={13} />}
              {workspace.visibility}
            </span>
            <span className={styles.badge}>
              <Users size={13} />
              {workspaceMembers.length || workspace.memberCount || 0} members
            </span>
            <span className={styles.badge} style={{ background: roleBadgeStyle.bg, color: roleBadgeStyle.color }}>
              {getRoleLabel(currentUserRole)}
            </span>
          </div>
          <h1>{workspace.name}</h1>
          <p>{workspace.description || 'Boards in this workspace are shown below.'}</p>
          {/* Owner info */}
          <div className={styles.ownerRow}>
            <Avatar
              src={workspace.ownerAvatarUrl}
              fullName={workspace.ownerName}
              username={workspace.ownerUsername}
              userId={workspace.ownerId}
              size="sm"
            />
            <span className={styles.ownerText}>
              Owner: {String(workspace.ownerId) === String(user?.userId) ? 'You' : workspace.ownerName || 'Unknown'}
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={handleOpenMembers}>
            <Users size={15} />
            Members
          </button>
          {canManage && (
            <button className={styles.secondaryBtn} onClick={() => setShowEditModal(true)}>
              <Edit2 size={15} />
              Edit Workspace
            </button>
          )}
          {canCreate && (
            <button className={styles.primaryBtn} onClick={() => setShowForm((value) => !value)}>
              <Plus size={16} />
              Create Board
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form className={styles.formCard} onSubmit={handleCreateBoard}>
          <div className={styles.formGrid}>
            <label>
              Board Name
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Sprint Planning"
                required
              />
            </label>
            <label>
              Visibility
              <select
                value={form.visibility}
                onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>
            <label>
              Description
              <input
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Optional board summary"
              />
            </label>
            <label>
              Background
              <input
                value={form.background}
                onChange={(event) => setForm((prev) => ({ ...prev, background: event.target.value }))}
                placeholder="Color or image URL"
              />
            </label>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryBtn} onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      )}

      {loadingBoards ? (
        <div className={styles.boardGrid}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className={styles.boardGrid}>
          {workspaceBoards.map((board) => (
            <Link key={board.id} to={`/boards/${board.id}`} className={styles.boardCard}>
              <div
                className={styles.boardPreview}
                style={{
                  background: board.background
                    ? board.background.startsWith('#') || board.background.startsWith('linear')
                      ? board.background
                      : `url(${board.background}) center/cover`
                    : 'linear-gradient(135deg, #f97316, #fb7185)',
                }}
              />
              <div className={styles.boardBody}>
                <div className={styles.boardTop}>
                  <h3>{board.name}</h3>
                  <span>{board.visibility}</span>
                </div>
                <p>{board.description || 'Open this board to manage lists and cards.'}</p>
                <div className={styles.boardMeta}>
                  <span>
                    <KanbanSquare size={14} />
                    {board.isClosed ? 'Closed' : 'Open'}
                  </span>
                  <span>{board.memberCount ?? 0} members</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loadingBoards && workspaceBoards.length === 0 && (
        <div className={styles.emptyState}>
          <KanbanSquare size={36} />
          <h2>No boards yet</h2>
          <p>{canCreate ? 'Create the first board for this workspace.' : 'A workspace admin needs to create a board first.'}</p>
        </div>
      )}

      {/* ── Members Panel (slide-in drawer) ─────────────────────────────── */}
      {showMembersPanel && (
        <div className={styles.panelOverlay} onClick={() => setShowMembersPanel(false)}>
          <div className={styles.membersPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h3>Workspace Members</h3>
              <button className={styles.panelClose} onClick={() => setShowMembersPanel(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.membersList}>
              {membersLoading && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}
              {workspaceMembers.map((member) => {
                const memberRole = member.role?.toUpperCase() || 'MEMBER';
                const memberBadge = getRoleBadgeColor(memberRole);
                const isWorkspaceOwner = String(member.userId) === String(workspace.ownerId);
                return (
                  <div key={member.userId} className={styles.memberRow}>
                    <Avatar
                      src={member.avatarUrl}
                      fullName={member.fullName}
                      username={member.username}
                      userId={member.userId}
                      size="md"
                    />
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>
                        {member.fullName || member.username || `User ${member.userId}`}
                        {String(member.userId) === String(user?.userId) && (
                          <span className={styles.youTag}>you</span>
                        )}
                      </div>
                      <div className={styles.memberEmail}>{member.email || ''}</div>
                    </div>

                    {/* Role badge or role select */}
                    {canManageMembersRole && !isWorkspaceOwner ? (
                      <select
                        className={styles.roleSelect}
                        value={memberRole}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span className={styles.roleBadge} style={{ background: memberBadge.bg, color: memberBadge.color }}>
                        {isWorkspaceOwner ? 'Owner' : getRoleLabel(memberRole)}
                      </span>
                    )}

                    {/* Remove button — only for OWNER/ADMIN, not for owner, not visible to guests */}
                    {canManageMembersRole && !isWorkspaceOwner && !isGuest && String(member.userId) !== String(user?.userId) && (
                      <button
                        className={styles.removeBtn}
                        onClick={() => setConfirmRemoveMember(member)}
                        title={`Remove ${member.fullName || member.username}`}
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              {workspaceMembers.length === 0 && !membersLoading && (
                <div className={styles.emptyMembers}>No members found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {showEditModal && (
        <div className={styles.panelOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.editModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h3>Edit Workspace</h3>
              <button className={styles.panelClose} onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>
            <form className={styles.editForm} onSubmit={handleEditWorkspace}>
              <label className={styles.editLabel}>
                Workspace Name
                <input
                  className={styles.editInput}
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="My Workspace"
                  required
                />
              </label>
              <label className={styles.editLabel}>
                Description
                <textarea
                  className={styles.editTextarea}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What is this workspace for?"
                  rows={3}
                />
              </label>
              <label className={styles.editLabel}>
                Visibility
                <select
                  className={styles.editInput}
                  value={editForm.visibility}
                  onChange={(e) => setEditForm((p) => ({ ...p, visibility: e.target.value }))}
                >
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </label>
              {editError && <p className={styles.editError}>{editError}</p>}
              <div className={styles.editActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className={styles.primaryBtn} disabled={editSaving}>
                  {editSaving ? 'Saving...' : editSaved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation */}
      <ConfirmModal
        open={!!confirmRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${confirmRemoveMember?.fullName || confirmRemoveMember?.username || 'this member'} from this workspace? They will lose access to all boards.`}
        confirmLabel="Remove Member"
        variant="danger"
        loading={removingMember}
        onConfirm={handleRemoveMember}
        onCancel={() => setConfirmRemoveMember(null)}
      />
    </section>
  );
}
