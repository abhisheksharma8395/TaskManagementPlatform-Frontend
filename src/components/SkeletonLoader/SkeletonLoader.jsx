/**
 * SkeletonLoader.jsx — Reusable skeleton loaders for loading states.
 */
import styles from './SkeletonLoader.module.css';

export function SkeletonLine({ width = '100%', height = '14px', className = '' }) {
  return <div className={`${styles.skeleton} ${className}`} style={{ width, height }} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.cardPreview} />
      <div className={styles.cardBody}>
        <SkeletonLine width="70%" height="18px" />
        <SkeletonLine width="90%" height="12px" />
        <SkeletonLine width="40%" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`${styles.row} ${className}`}>
      <div className={`${styles.skeleton} ${styles.circle}`} />
      <div className={styles.rowContent}>
        <SkeletonLine width="60%" height="14px" />
        <SkeletonLine width="40%" height="11px" />
      </div>
    </div>
  );
}

export function SkeletonSidebarItem({ className = '' }) {
  return (
    <div className={`${styles.sidebarItem} ${className}`}>
      <div className={`${styles.skeleton} ${styles.smallDot}`} />
      <SkeletonLine width="70%" height="13px" />
    </div>
  );
}
