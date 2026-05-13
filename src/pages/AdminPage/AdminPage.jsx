import { useEffect, useMemo, useState } from 'react';
import { BarChart3, BellRing, Building2, KanbanSquare, Shield, Users } from 'lucide-react';
import * as authService from '../../api/authService';
import * as boardService from '../../api/boardService';
import * as notificationService from '../../api/notificationService';
import * as workspaceService from '../../api/workspaceService';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [boards, setBoards] = useState([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('Platform notice');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      Promise.all([
        authService.searchUsersByRole('USER').catch(() => []),
        authService.searchUsersByRole('ADMIN').catch(() => []),
      ]).then(([members, admins]) => {
        const map = new Map();
        [...members, ...admins].forEach((user) => map.set(user.userId, user));
        return [...map.values()];
      }),
      workspaceService.getAllWorkspaces().catch(() => []),
      boardService.getAllBoards().catch(() => []),
    ]).then(([allUsers, allWorkspaces, allBoards]) => {
      setUsers(allUsers);
      setWorkspaces(allWorkspaces);
      setBoards(allBoards);
    });
  }, []);

  const stats = useMemo(() => ([
    { icon: Users, label: 'Users', value: users.length, tone: '#0369a1' },
    { icon: Building2, label: 'Workspaces', value: workspaces.length, tone: '#c2410c' },
    { icon: KanbanSquare, label: 'Boards', value: boards.length, tone: '#7c3aed' },
    { icon: Shield, label: 'Admins', value: users.filter((user) => user.role === 'ADMIN').length, tone: '#15803d' },
  ]), [boards.length, users, workspaces.length]);

  const handleBroadcast = async (event) => {
    event.preventDefault();
    if (!message.trim() || users.length === 0) return;

    setSending(true);
    try {
      await notificationService.sendBulkNotification({
        title: title.trim(),
        message: message.trim(),
        recipientIds: users.map((user) => user.userId),
      });
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Platform Admin</p>
          <h1>Global visibility across users, workspaces, and boards.</h1>
          <p>Use this area to review the platform surface and send broadcast updates.</p>
        </div>
        <BarChart3 size={42} className={styles.heroIcon} />
      </div>

      <div className={styles.stats}>
        {stats.map(({ icon: Icon, label, value, tone }) => (
          <article key={label} className={styles.statCard}>
            <Icon size={18} style={{ color: tone }} />
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2>Users</h2>
          <div className={styles.list}>
            {users.slice(0, 10).map((user) => (
              <div key={user.userId} className={styles.row}>
                <div>
                  <strong>{user.fullName || user.username}</strong>
                  <p>{user.email}</p>
                </div>
                <span>{user.role}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Broadcast Notification</h2>
          <form onSubmit={handleBroadcast} className={styles.form}>
            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Message
              <textarea
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Share an important update with the platform."
              />
            </label>
            <button type="submit" className={styles.primaryBtn} disabled={sending}>
              <BellRing size={15} />
              {sending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
