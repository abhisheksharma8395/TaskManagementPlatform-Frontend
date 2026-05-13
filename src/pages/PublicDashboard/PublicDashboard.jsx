import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Globe, Users } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import styles from './PublicDashboard.module.css';

export default function PublicDashboard() {
  const { publicWorkspaces, loadingWorkspaces } = useBoard();

  const sortedPublicWorkspaces = useMemo(
    () => [...publicWorkspaces].sort((left, right) => left.name.localeCompare(right.name)),
    [publicWorkspaces],
  );

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Public Dashboard</p>
          <h1 className={styles.title}>Browse all public workspaces.</h1>
          <p className={styles.subtitle}>
            These workspaces are visible to all members across the platform.
          </p>
        </div>
      </div>

      {loadingWorkspaces ? (
        <div className={styles.emptyState}>Loading public workspaces...</div>
      ) : sortedPublicWorkspaces.length === 0 ? (
        <div className={styles.emptyState}>
          <Globe size={28} />
          <p>No public workspaces are available right now.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {sortedPublicWorkspaces.map((workspace) => (
            <Link key={workspace.id} to={`/workspaces/${workspace.id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <Building2 size={18} />
                </div>
                <span className={styles.visibility}>
                  <Globe size={14} />
                  PUBLIC
                </span>
              </div>
              <h3>{workspace.name}</h3>
              <p>{workspace.description || 'No description yet.'}</p>
              <div className={styles.cardMeta}>
                <span>
                  <Users size={14} />
                  {workspace.memberCount ?? 0} members
                </span>
                <span>Open workspace</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
