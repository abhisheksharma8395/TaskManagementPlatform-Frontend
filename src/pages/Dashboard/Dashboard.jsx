import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Building2, Users, Lock, Globe, MoreHorizontal, LogOut, Trash2, Pencil, KanbanSquare, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import { canDeleteWorkspace, canEditWorkspace, canLeaveWorkspace } from '../../utils/permissions';
import Avatar, { AvatarStack } from '../../components/Avatar/Avatar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { SkeletonCard } from '../../components/SkeletonLoader/SkeletonLoader';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    workspaces,
    assignedBoards,
    extraWorkspacesById,
    loadingAssigned,
    loadingWorkspaces,
    createWorkspace,
    deleteWorkspace,
    getCachedWorkspaceMembers,
  } = useBoard();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', visibility: 'PRIVATE' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete workspace
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const sortedWorkspaces = useMemo(
    () => [...workspaces].sort((left, right) => left.name.localeCompare(right.name)),
    [workspaces],
  );

  // Boards directly assigned to the user that belong to workspaces they don't own/belong to
  const ownWorkspaceIds = useMemo(() => new Set(workspaces.map((ws) => String(ws.id))), [workspaces]);
  const sharedBoards = useMemo(() => {
    if (!assignedBoards?.length) return [];
    const seen = new Set();
    return assignedBoards.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true; // Show all; workspace label will clarify context
    });
  }, [assignedBoards]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError('');
    try {
      await createWorkspace({
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
      });
      setForm({ name: '', description: '', visibility: 'PRIVATE' });
      setShowModal(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to create workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWorkspace(deleteTarget.id);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Workspace Dashboard</p>
          <h1 className={styles.title}>Organize work by workspace, then drill into boards.</h1>
          <p className={styles.subtitle}>
            FlowBoard follows the case-study hierarchy: workspace, board, list, and card.
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Create Workspace
        </button>
      </div>

      {loadingWorkspaces ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Your Workspaces</h2>
              <p className={styles.sectionText}>Loading workspaces...</p>
            </div>
          </div>
          <div className={styles.grid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>
      ) : (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Your Workspaces</h2>
              <p className={styles.sectionText}>Workspaces you created or where you are already a member.</p>
            </div>
          </div>

          {sortedWorkspaces.length === 0 ? (
            <div className={styles.emptyState}>
              <Building2 size={36} />
              <h2>No personal workspaces yet</h2>
              <p>Create your first workspace to start building boards and collaborating with your team.</p>
              <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
                <Plus size={16} />
                Create Workspace
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {sortedWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  user={user}
                  members={getCachedWorkspaceMembers(workspace.id)}
                  onDelete={() => setDeleteTarget(workspace)}
                  onEdit={() => navigate(`/workspaces/${workspace.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Shared With Me ────────────────────────────────────────────── */}
      {(sharedBoards.length > 0 || loadingAssigned) && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                <Share2 size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Shared With Me
              </h2>
              <p className={styles.sectionText}>Boards you have been directly added to.</p>
            </div>
          </div>

          {loadingAssigned && !sharedBoards.length ? (
            <div className={styles.grid}>
              <SkeletonCard /><SkeletonCard />
            </div>
          ) : (
            <div className={styles.boardGrid}>
              {sharedBoards.map((board) => {
                // Resolve workspace name: check user's own workspaces first, then extraWorkspacesById
                const ws = workspaces.find((w) => String(w.id) === String(board.workspaceId))
                  || extraWorkspacesById?.[String(board.workspaceId)];
                const wsName = ws?.name || null;
                const isPrivate = board.visibility === 'PRIVATE';
                return (
                  <Link key={board.id} to={`/boards/${board.id}`} className={styles.boardCard}>
                    <div
                      className={styles.boardCardBanner}
                      style={{
                        background: board.background
                          ? board.background.startsWith('#') || board.background.startsWith('linear')
                            ? board.background
                            : `url(${board.background}) center/cover`
                          : 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)'
                      }}
                    />
                    <div className={styles.boardCardBody}>
                      <div className={styles.boardCardHeader}>
                        <KanbanSquare size={14} className={styles.boardCardIcon} />
                        <h3 className={styles.boardCardName}>{board.name}</h3>
                        <span className={styles.boardCardVisibility}>
                          {isPrivate ? <Lock size={11} /> : <Globe size={11} />}
                          {board.visibility}
                        </span>
                      </div>
                      {board.description && (
                        <p className={styles.boardCardDesc}>{board.description}</p>
                      )}
                      <div className={styles.boardCardFooter}>
                        <span className={styles.boardCardWs}>
                          <Building2 size={11} />
                          {wsName || <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>Loading…</span>}
                        </span>
                        <span className={styles.openLabel}>Open board →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Delete Workspace Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Workspace"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All boards, lists, and cards inside will be removed. This cannot be undone.`}
        confirmLabel="Delete Workspace"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteWorkspace}
        onCancel={() => setDeleteTarget(null)}
      />

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h2>Create Workspace</h2>
            <p>Set up a workspace for a team, client, or initiative.</p>
            <form onSubmit={handleCreate} className={styles.form}>
              <label>
                Workspace Name
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Product Delivery"
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="What is this workspace for?"
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
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.actions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function WorkspaceCard({ workspace, user, members, onDelete, onEdit }) {
  const [showActions, setShowActions] = useState(false);
  const isOwner = String(workspace.ownerId) === String(user?.userId);
  const canDelete = canDeleteWorkspace(user, workspace, members);
  const canEditWs = canEditWorkspace(user, workspace, members);
  const canLeave = canLeaveWorkspace(user, workspace, members);

  return (
    <div className={styles.card} onMouseLeave={() => setShowActions(false)}>
      {/* Header banner */}
      <div className={styles.cardBanner}>
        <div className={styles.cardIcon}>
          <Building2 size={18} />
        </div>

        {/* Actions dropdown */}
        <div className={styles.cardActionsWrap}>
          <button className={styles.cardActionsBtn} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowActions((v) => !v); }}>
            <MoreHorizontal size={16} />
          </button>
          {showActions && (
            <div className={styles.actionsDropdown} onClick={(e) => e.stopPropagation()}>
              <Link to={`/workspaces/${workspace.id}`} className={styles.actionItem}>
                <Building2 size={13} /> Open
              </Link>
              {canEditWs && (
                <button className={styles.actionItem} onClick={() => { setShowActions(false); onEdit(); }}>
                  <Pencil size={13} /> Edit
                </button>
              )}
              {canDelete && (
                <button className={`${styles.actionItem} ${styles.actionDanger}`} onClick={() => { setShowActions(false); onDelete(); }}>
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Link to={`/workspaces/${workspace.id}`} className={styles.cardBody}>
        <div className={styles.cardHeaderRow}>
          <h3>{workspace.name}</h3>
          <span className={styles.visibility}>
            {workspace.visibility === 'PUBLIC' ? <Globe size={14} /> : <Lock size={14} />}
            {workspace.visibility}
          </span>
        </div>
        <p>{workspace.description || 'No description yet.'}</p>

        {/* Owner avatar */}
        <div className={styles.cardOwner}>
          <Avatar
            src={workspace.ownerAvatarUrl}
            fullName={workspace.ownerName}
            username={workspace.ownerUsername}
            userId={workspace.ownerId}
            size="xs"
          />
          <span className={styles.ownerLabel}>
            {isOwner ? 'You' : workspace.ownerName || 'Owner'}
          </span>
        </div>

        <div className={styles.cardMeta}>
          <span className={styles.memberInfo}>
            {members.length > 0 ? (
              <AvatarStack users={members} max={4} size="xs" />
            ) : (
              <Users size={14} />
            )}
            <span>{workspace.memberCount ?? members.length ?? 0} members</span>
          </span>
          <span className={styles.openLabel}>Open workspace →</span>
        </div>
      </Link>
    </div>
  );
}
