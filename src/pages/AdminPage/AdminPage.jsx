import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, BellRing, Building2, KanbanSquare, Shield,
  Users, Search, UserX, RefreshCw, CheckCircle, XCircle, Mail, Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import * as authService from '../../api/authService';
import * as boardService from '../../api/boardService';
import * as notificationService from '../../api/notificationService';
import * as workspaceService from '../../api/workspaceService';
import styles from './AdminPage.module.css';

/* ── small status badge ────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const isAdmin = role === 'ADMIN' || role === 'PLATFORM_ADMIN';
  return (
    <span className={isAdmin ? styles.badgeAdmin : styles.badgeUser}>
      {isAdmin ? '🛡️ Admin' : '👤 User'}
    </span>
  );
}

/* ── main ──────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [boards, setBoards] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [message, setMessage] = useState('');
  const [notifTitle, setNotifTitle] = useState('Platform notice');
  const [sending, setSending] = useState(false);
  const [notifStatus, setNotifStatus] = useState(null); // 'ok' | 'error'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    variant: 'danger',
    onConfirm: null,
    loading: false,
  });

  const triggerDeactivateUser = (userId, name) => {
    setConfirmConfig({
      open: true,
      title: 'Deactivate Account',
      message: `Are you sure you want to deactivate ${name}'s account? They will lose access to the platform.`,
      confirmLabel: 'Deactivate',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        try {
          await authService.deactivateAccount(userId);
          await fetchAll(true);
        } catch (error) {
          console.error("Failed to deactivate account:", error);
        } finally {
          setConfirmConfig(prev => ({ ...prev, open: false, loading: false }));
        }
      }
    });
  };

  const triggerDeleteWorkspace = (workspaceId, name) => {
    setConfirmConfig({
      open: true,
      title: 'Delete Workspace',
      message: `Are you sure you want to permanently delete the workspace "${name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        try {
          await workspaceService.deleteWorkspace(workspaceId);
          await fetchAll(true);
        } catch (error) {
          console.error("Failed to delete workspace:", error);
        } finally {
          setConfirmConfig(prev => ({ ...prev, open: false, loading: false }));
        }
      }
    });
  };

  const triggerDeleteBoard = (boardId, name) => {
    setConfirmConfig({
      open: true,
      title: 'Delete Board',
      message: `Are you sure you want to permanently delete the board "${name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        try {
          await boardService.deleteBoard(boardId);
          await fetchAll(true);
        } catch (error) {
          console.error("Failed to delete board:", error);
        } finally {
          setConfirmConfig(prev => ({ ...prev, open: false, loading: false }));
        }
      }
    });
  };

  const fetchAll = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [[members, admins], allWorkspaces, allBoards] = await Promise.all([
        Promise.all([
          authService.searchUsersByRole('USER').catch(() => []),
          authService.searchUsersByRole('ADMIN').catch(() => []),
        ]),
        workspaceService.getAllWorkspaces().catch(() => []),
        boardService.getAllBoards().catch(() => []),
      ]);
      const map = new Map();
      [...members, ...admins].forEach((u) => map.set(u.userId, u));
      setUsers([...map.values()]);
      setWorkspaces(allWorkspaces);
      setBoards(allBoards);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const stats = useMemo(() => ([
    { icon: Users, label: 'Total Users', value: users.length, color: '#7c3aed', bg: '#f5f3ff' },
    { icon: Building2, label: 'Workspaces', value: workspaces.length, color: '#0ea5e9', bg: '#f0f9ff' },
    { icon: KanbanSquare, label: 'Boards', value: boards.length, color: '#f97316', bg: '#fff7ed' },
    { icon: Shield, label: 'Admins', value: users.filter((u) => u.role === 'ADMIN' || u.role === 'PLATFORM_ADMIN').length, color: '#22c55e', bg: '#f0fdf4' },
  ]), [boards.length, users, workspaces.length]);

  const filteredUsers = useMemo(() =>
    users.filter((u) =>
      !userSearch ||
      (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
    ),
    [users, userSearch]
  );

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!message.trim() || users.length === 0) return;
    setSending(true);
    setNotifStatus(null);
    try {
      await notificationService.sendBulkNotification({
        title: notifTitle.trim(),
        message: message.trim(),
        recipientIds: users.map((u) => u.userId),
      });
      setMessage('');
      setNotifStatus('ok');
    } catch {
      setNotifStatus('error');
    } finally {
      setSending(false);
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'workspaces', label: 'Workspaces', icon: Building2 },
    { id: 'boards', label: 'Boards', icon: KanbanSquare },
    { id: 'broadcast', label: 'Broadcast', icon: BellRing },
  ];

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Loading admin data…</p>
      </div>
    );
  }

  return (
    <section className={styles.page}>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <p className={styles.eyebrow}>Platform Admin</p>
          <h1>Admin Dashboard</h1>
          <p>Global visibility across users, workspaces, and boards. Manage the entire platform from here.</p>
        </div>
        <div className={styles.heroRight}>
          <button
            className={styles.refreshBtn}
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCw size={15} className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <div className={styles.stats}>
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <article key={label} className={styles.statCard} style={{ '--card-bg': bg, '--card-color': color }}>
            <div className={styles.statIconWrap}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <strong className={styles.statNum}>{value}</strong>
              <span className={styles.statLabel}>{label}</span>
            </div>
          </article>
        ))}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <div className={styles.tabBar}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.tabBtn} ${activeTab === id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className={styles.overviewGrid}>
          <div className={styles.panel}>
            <h2>Recent Users</h2>
            <div className={styles.list}>
              {users.slice(0, 6).map((u) => (
                <div key={u.userId} className={styles.row}>
                  <div className={styles.avatarCircle}>
                    {(u.fullName || u.username || '?')[0].toUpperCase()}
                  </div>
                  <div className={styles.rowInfo}>
                    <strong>{u.fullName || u.username}</strong>
                    <p>{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
              ))}
              {users.length === 0 && <p className={styles.emptyMsg}>No users found.</p>}
            </div>
          </div>

          <div className={styles.panel}>
            <h2>Recent Workspaces</h2>
            <div className={styles.list}>
              {workspaces.slice(0, 6).map((w) => (
                <div key={w.workspaceId || w.id} className={styles.row}>
                  <div className={styles.workspaceIcon}>🏢</div>
                  <div className={styles.rowInfo}>
                    <strong>{w.name}</strong>
                    <p>{w.visibility || 'Private'} · {w.memberCount ?? '—'} members</p>
                  </div>
                </div>
              ))}
              {workspaces.length === 0 && <p className={styles.emptyMsg}>No workspaces found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {activeTab === 'users' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>All Users <span className={styles.count}>({filteredUsers.length})</span></h2>
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search by name, username or email…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatarCircle}>{(u.fullName || u.username || '?')[0].toUpperCase()}</div>
                        <span>{u.fullName || '—'}</span>
                      </div>
                    </td>
                    <td className={styles.mono}>@{u.username}</td>
                    <td>
                      <div className={styles.emailCell}>
                        <Mail size={13} />
                        {u.email || '—'}
                      </div>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <span className={u.active === false ? styles.statusInactive : styles.statusActive}>
                        {u.active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {u.userId !== currentUser?.userId && u.active !== false && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => triggerDeactivateUser(u.userId, u.fullName || u.username)}
                          title="Deactivate Account"
                        >
                          <UserX size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={6} className={styles.emptyMsg}>No users match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WORKSPACES */}
      {activeTab === 'workspaces' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>All Workspaces <span className={styles.count}>({workspaces.length})</span></h2>
          </div>
          <div className={styles.cardGrid}>
            {workspaces.map((w) => (
              <div key={w.workspaceId || w.id} className={styles.wsCard}>
                <div className={styles.wsCardBody} style={{ width: '100%' }}>
                  <div className={styles.wsCardHeader}>
                    <div className={styles.wsCardIcon}>🏢</div>
                    <button
                      className={styles.wsDeleteBtn}
                      onClick={() => triggerDeleteWorkspace(w.workspaceId || w.id, w.name)}
                      title="Delete Workspace"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <strong>{w.name}</strong>
                    <p>{w.description || 'No description'}</p>
                    <div className={styles.wsCardMeta}>
                      <span className={w.visibility === 'PUBLIC' ? styles.badgePublic : styles.badgePrivate}>
                        {w.visibility || 'Private'}
                      </span>
                      <span className={styles.metaItem}>👥 {w.memberCount ?? '—'} members</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {workspaces.length === 0 && <p className={styles.emptyMsg}>No workspaces found.</p>}
          </div>
        </div>
      )}

      {/* BOARDS */}
      {activeTab === 'boards' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>All Boards <span className={styles.count}>({boards.length})</span></h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Board Name</th>
                  <th>Workspace</th>
                  <th>Visibility</th>
                  <th>Members</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {boards.map((b) => (
                  <tr key={b.boardId || b.id}>
                    <td>
                      <div className={styles.boardNameCell}>
                        <KanbanSquare size={14} style={{ color: '#7c3aed' }} />
                        {b.name}
                      </div>
                    </td>
                    <td>{b.workspaceName || b.workspaceId || '—'}</td>
                    <td>
                      <span className={b.visibility === 'PUBLIC' ? styles.badgePublic : styles.badgePrivate}>
                        {b.visibility || 'Private'}
                      </span>
                    </td>
                    <td>{b.memberCount ?? '—'}</td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => triggerDeleteBoard(b.boardId || b.id, b.name)}
                        title="Delete Board"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {boards.length === 0 && (
                  <tr><td colSpan={5} className={styles.emptyMsg}>No boards found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className={styles.broadcastGrid}>
          <div className={styles.panel}>
            <h2>Broadcast Notification</h2>
            <p className={styles.panelDesc}>
              Send a platform-wide notification to all <strong>{users.length}</strong> registered users simultaneously.
            </p>

            {notifStatus === 'ok' && (
              <div className={styles.alertSuccess}>
                <CheckCircle size={16} />
                Notification sent to {users.length} users successfully!
              </div>
            )}
            {notifStatus === 'error' && (
              <div className={styles.alertError}>
                <XCircle size={16} />
                Failed to send notification. Please try again.
              </div>
            )}

            <form onSubmit={handleBroadcast} className={styles.form}>
              <label className={styles.fieldLabel}>
                Notification Title
                <input
                  className={styles.fieldInput}
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. Scheduled Maintenance"
                  required
                />
              </label>
              <label className={styles.fieldLabel}>
                Message
                <textarea
                  className={styles.fieldInput}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share an important update with all platform users…"
                  required
                />
              </label>
              <button type="submit" className={styles.primaryBtn} disabled={sending || users.length === 0}>
                <BellRing size={15} />
                {sending ? 'Sending…' : `Send to ${users.length} Users`}
              </button>
            </form>
          </div>

          <div className={styles.panel}>
            <h2>Recipient Preview</h2>
            <p className={styles.panelDesc}>This notification will be delivered to:</p>
            <div className={styles.list}>
              {users.slice(0, 8).map((u) => (
                <div key={u.userId} className={styles.row}>
                  <div className={styles.avatarCircle}>{(u.fullName || u.username || '?')[0].toUpperCase()}</div>
                  <div className={styles.rowInfo}>
                    <strong>{u.fullName || u.username}</strong>
                    <p>{u.email}</p>
                  </div>
                </div>
              ))}
              {users.length > 8 && (
                <p className={styles.moreUsers}>+ {users.length - 8} more users</p>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={confirmConfig.open}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        variant={confirmConfig.variant}
        loading={confirmConfig.loading}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
      />
    </section>
  );
}
