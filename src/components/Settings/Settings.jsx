/**
 * Settings.jsx — Full settings page
 * Sections: Profile, Change Password, Preferences
 */
import { useState } from 'react';
import {
  Camera, Key, Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../api/authService';
import AvatarUpload from '../AvatarUpload/AvatarUpload';
import styles from './Settings.module.css';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();

  // ── Active section ─────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState('profile');

  // ── Profile ────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    bio: '',
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const profileInitials = (user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase();

  // ── Password ───────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);


  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleProfileSave = () => {
    // Note: backend has no exposed PUT /auth/profile route.
    // Updates are persisted locally via AuthContext.updateUser (localStorage).
    setProfileError('');
    if (!profile.name.trim()) { setProfileError('Name cannot be empty.'); return; }
    try {
      updateUser({ fullName: profile.name });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      setProfileError('Failed to save changes.');
    }
  };

  const handleAvatarUploaded = (avatarUrl) => {
    updateUser({ avatarUrl });
  };

  const handlePasswordChange = async () => {
    setPwError(''); setPwSuccess(false);
    if (!pwForm.oldPassword || !pwForm.newPassword) { setPwError('All fields required.'); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    if (pwForm.newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    setPwLoading(true);
    try {
      await authService.changePassword({
        username: user?.username,
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess(true);
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) {
      setPwError(e?.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };


  // ── Nav items ──────────────────────────────────────────────────────────────
  const navItems = [
    { key: 'profile', label: 'Profile', icon: <Camera size={15} /> },
    { key: 'password', label: 'Password', icon: <Key size={15} /> },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        {/* Left nav */}
        <aside className={styles.nav}>
          <div className={styles.navTitle}>Settings</div>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`${styles.navItem} ${activeSection === item.key ? styles.navActive : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div className={styles.mainContent}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>
              {navItems.find((n) => n.key === activeSection)?.label}
            </h1>
          </div>

          {/* ── Profile ─────────────────────────────────────────────────── */}
          {activeSection === 'profile' && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Profile Information</h2>
              <AvatarUpload
                avatarUrl={user?.avatarUrl}
                initials={profileInitials}
                onUploaded={handleAvatarUploaded}
              />

              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input className={styles.input} value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input className={styles.input} type="email" value={profile.email}
                    disabled autoComplete="off"
                    style={{ background: '#f3f4f6', color: '#9ca3af' }} />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Username</label>
                <input className={styles.input} value={user?.username || ''} disabled
                  style={{ background: '#f3f4f6', color: '#9ca3af' }} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Bio</label>
                <textarea className={styles.textarea} value={profile.bio} rows={3}
                  placeholder="Tell your team about yourself..."
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              </div>
              {profileError && <p className={styles.errorText}>{profileError}</p>}
              <div className={styles.cardFooter}>
                <button className={`${styles.saveChangesBtn} ${profileSaved ? styles.saved : ''}`} onClick={handleProfileSave}>
                  {profileSaved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
                </button>
              </div>
            </section>
          )}

          {/* ── Password ────────────────────────────────────────────────── */}
          {activeSection === 'password' && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Change Password</h2>
              <p className={styles.cardSubtitle}>Keep your account secure with a strong password.</p>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Current Password</label>
                <input className={styles.input} type="password" value={pwForm.oldPassword}
                  name="current-password-flowboard"
                  autoComplete="new-password"
                  placeholder="Enter current password"
                  onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>New Password</label>
                <input className={styles.input} type="password" value={pwForm.newPassword}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Confirm New Password</label>
                <input className={styles.input} type="password" value={pwForm.confirm}
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
              </div>

              {pwError && <p className={styles.errorText}>{pwError}</p>}
              {pwSuccess && <p className={styles.successText}>✓ Password changed successfully!</p>}

              <div className={styles.cardFooter}>
                <button className={styles.saveChangesBtn} onClick={handlePasswordChange} disabled={pwLoading}>
                  {pwLoading ? <><Loader size={14} className={styles.spin} /> Updating...</> : 'Update Password'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
