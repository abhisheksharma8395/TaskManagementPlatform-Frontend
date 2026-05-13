/**
 * Avatar.jsx — Reusable avatar component across the entire application.
 * Shows an actual image when avatarUrl exists, otherwise falls back to initials.
 */
import styles from './Avatar.module.css';

const AVATAR_COLORS = [
  '#7c3aed', '#ec4899', '#10b981', '#f59e0b',
  '#3b82f6', '#ef4444', '#0f766e', '#06b6d4',
  '#8b5cf6', '#d946ef',
];

function getColorFromId(userId) {
  const num = typeof userId === 'number' ? userId : parseInt(userId, 10) || 0;
  return AVATAR_COLORS[num % AVATAR_COLORS.length];
}

function getInitials(fullName, username) {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return fullName.slice(0, 2).toUpperCase();
  }
  if (username) return username.slice(0, 2).toUpperCase();
  return '?';
}

/**
 * @param {Object} props
 * @param {string} [props.src] - Image URL (avatarUrl)
 * @param {string} [props.fullName] - Full name for initials
 * @param {string} [props.username] - Username fallback for initials
 * @param {string|number} [props.userId] - Used for color selection
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='md'] - Size variant
 * @param {string} [props.className] - Additional CSS class
 * @param {object} [props.style] - Additional inline styles
 * @param {boolean} [props.showTooltip=false] - Whether to show tooltip
 * @param {string} [props.tooltip] - Custom tooltip text
 */
export default function Avatar({
  src,
  fullName,
  username,
  userId,
  size = 'md',
  className = '',
  style = {},
  showTooltip = false,
  tooltip,
}) {
  const initials = getInitials(fullName, username);
  const bgColor = getColorFromId(userId);
  const tooltipText = tooltip || fullName || username || '';
  const sizeClass = styles[`size_${size}`] || styles.size_md;

  return (
    <div
      className={`${styles.avatar} ${sizeClass} ${className}`}
      style={{ background: src ? 'transparent' : bgColor, ...style }}
      title={showTooltip ? tooltipText : undefined}
    >
      {src ? (
        <img
          className={styles.image}
          src={src}
          alt={fullName || username || 'User'}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
          }}
        />
      ) : null}
      <span
        className={styles.initials}
        style={src ? { display: 'none' } : {}}
      >
        {initials}
      </span>
    </div>
  );
}

/**
 * AvatarStack — Shows a row of stacked avatars with an overflow count.
 */
export function AvatarStack({ users = [], max = 3, size = 'sm', className = '' }) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className={`${styles.stack} ${className}`}>
      {visible.map((u, i) => (
        <Avatar
          key={u.userId || i}
          src={u.avatarUrl}
          fullName={u.fullName}
          username={u.username}
          userId={u.userId}
          size={size}
          showTooltip
          className={styles.stackItem}
        />
      ))}
      {overflow > 0 && (
        <div className={`${styles.avatar} ${styles[`size_${size}`]} ${styles.stackItem} ${styles.overflowBadge}`}>
          <span className={styles.initials}>+{overflow}</span>
        </div>
      )}
    </div>
  );
}
