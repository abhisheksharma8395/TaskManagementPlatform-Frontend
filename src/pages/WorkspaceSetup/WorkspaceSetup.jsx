/**
 * WorkspaceSetup.jsx
 * Shown after login when the user has no workspaces yet.
 *
 * Key fix: createWorkspace now passes correct data shape to backend.
 * After creating, fetchWorkspaces and fetchBoards are called via App.jsx's useEffect.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import styles from './WorkspaceSetup.module.css';

export default function WorkspaceSetup() {
  const { user } = useAuth();
  const { createWorkspace, fetchWorkspaces, fetchBoards } = useBoard();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      // createWorkspace sends { name, visibility: 'PUBLIC' } by default
      const ws = await createWorkspace({ name: name.trim() });
      // Re-fetch workspaces so the app switches to the main view
      if (user?.userId) await fetchWorkspaces(user.userId);
      // Fetch boards for the new workspace
      if (ws?.id) await fetchBoards(ws.id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>🚀</div>
        <h1 className={styles.title}>Create your workspace</h1>
        <p className={styles.subtitle}>
          A workspace is where your team's boards and tasks live.
        </p>

        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.field}>
            <label className={styles.label}>Workspace Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. High Performance Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            className={styles.btn}
            disabled={loading || !name.trim()}
          >
            {loading ? 'Creating...' : 'Create Workspace →'}
          </button>
        </form>
      </div>
    </div>
  );
}
