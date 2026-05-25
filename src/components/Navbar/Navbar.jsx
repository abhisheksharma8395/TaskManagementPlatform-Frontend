import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as notificationService from '../../api/notificationService';
import Avatar from '../Avatar/Avatar';
import styles from './Navbar.module.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isPlatformAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const links = useMemo(() => {
    const items = [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Settings', to: '/settings' },
    ];
    if (isPlatformAdmin) items.push({ label: 'Admin', to: '/admin' });
    return items;
  }, [isPlatformAdmin]);

  useEffect(() => {
    notificationService.getUnreadCount()
      .then((data) => setUnreadCount(data.count ?? data.unreadCount ?? 0))
      .catch(() => {});

    notificationService.getMyNotifications()
      .then((data) => setNotifications(Array.isArray(data) ? data : data.notifications ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifDropdown(false);
      if (userRef.current && !userRef.current.contains(event.target)) setShowUserMenu(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    setNotifications((prev) => prev.map((notification) => (
      notification.notificationId === notificationId ? { ...notification, isRead: true } : notification
    )));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const toggleNotifications = async () => {
    const nextValue = !showNotifDropdown;
    setShowNotifDropdown(nextValue);
    if (!nextValue || unreadCount === 0) return;

    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch {}
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <Link to={isPlatformAdmin ? '/admin' : '/dashboard'} className={styles.logo}>
          <img src="/logo.svg" alt="FlowBoard" height={34} width={34} style={{ display: 'block' }} />
          <span className={styles.logoText}>FlowBoard</span>
        </Link>

        <nav className={styles.nav}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.navLink} ${location.pathname.startsWith(link.to) ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.right}>
        <div className={styles.relativeWrap} ref={notifRef}>
          <button className={styles.iconBtn} onClick={toggleNotifications}>
            <Bell size={18} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {showNotifDropdown && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <span>Notifications</span>
                {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount} new</span>}
              </div>

              {notifications.length === 0 ? (
                <p className={styles.emptyNotif}>No notifications yet.</p>
              ) : (
                notifications.slice(0, 8).map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`${styles.notifItem} ${!notification.isRead ? styles.unread : ''}`}
                    onClick={() => !notification.isRead && handleMarkRead(notification.notificationId)}
                  >
                    <p className={styles.notifMsg}>{notification.message}</p>
                    <span className={styles.notifTime}>
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button className={styles.iconBtn} onClick={() => navigate('/settings')}>
          <Settings size={18} />
        </button>

        <div className={styles.relativeWrap} ref={userRef}>
          <button className={styles.avatarBtn} onClick={() => setShowUserMenu((value) => !value)}>
            <Avatar
              src={user?.avatarUrl}
              fullName={user?.fullName}
              username={user?.username}
              userId={user?.userId}
              size="sm"
              style={{ border: 'none' }}
            />
          </button>

          {showUserMenu && (
            <div className={styles.userMenu}>
              <div className={styles.userMenuHeader}>
                <strong>{user?.fullName || user?.username}</strong>
                <span>{user?.email}</span>
              </div>
              <button className={styles.userMenuItem} onClick={() => navigate('/settings')}>
                <User size={14} />
                Profile & Settings
              </button>
              {isPlatformAdmin && (
                <button className={styles.userMenuItem} onClick={() => navigate('/admin')}>
                  <Shield size={14} />
                  Admin Console
                </button>
              )}
              <button className={`${styles.userMenuItem} ${styles.danger}`} onClick={logout}>
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
