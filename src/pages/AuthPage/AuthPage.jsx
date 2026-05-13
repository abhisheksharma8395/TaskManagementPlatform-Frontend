/**
 * AuthPage.jsx
 * Login and registration form with Google OAuth2 support.
 *
 * Google OAuth flow:
 * 1. User clicks "Continue with Google"
 * 2. Browser redirects to backend: GET /auth-service/oauth2/authorization/google
 * 3. Google handles authentication and redirects back to backend
 * 4. Backend's OAuth2LoginSuccessHandler generates a JWT and redirects to:
 *    http://localhost:5173/oauth-success?token=<JWT>
 * 5. App.jsx detects the /oauth-success route, extracts the token,
 *    fetches the user profile, and logs them in.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPage.module.css';

// The API Gateway URL — must match your backend
const API_GATEWAY = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8765';
const GOOGLE_OAUTH_URL = `${API_GATEWAY}/auth-service/oauth2/authorization/google`;

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.username, form.password);
      } else {
        await register({
          username: form.username,
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Redirect the browser to the backend's Google OAuth2 endpoint.
   * The backend will handle the Google redirect and send the user back
   * to /oauth-success?token=... which App.jsx handles.
   */
  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_OAUTH_URL;
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setForm({ fullName: '', username: '', email: '', password: '' });
  };

  return (
    <div className={styles.page}>
      {/* Left panel — branding */}
      <div className={styles.leftPanel}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🚀</span>
          <span className={styles.brandName}>FlowBoard</span>
        </div>
        <div className={styles.heroText}>
          <h1>Manage tasks,<br />ship faster.</h1>
          <p>A powerful Kanban-style project management platform for high-performance teams.</p>
        </div>
        <div className={styles.features}>
          {['Drag & drop boards', 'Real-time collaboration', 'Timeline views', 'Smart notifications'].map((f) => (
            <div key={f} className={styles.featureItem}>
              <span className={styles.featureDot} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}
              onClick={() => switchMode('register')}
            >
              Create Account
            </button>
          </div>

          {/* ── Google OAuth button ─────────────────────────────────────── */}
          <button className={styles.googleBtn} onClick={handleGoogleLogin} type="button">
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or continue with username</span>
            <span className={styles.dividerLine} />
          </div>

          {/* ── Username / password form ────────────────────────────────── */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input
                  className={styles.input}
                  name="fullName"
                  type="text"
                  placeholder="Alex Henderson"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                name="username"
                type="text"
                placeholder="alexh"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label}>Email Address</label>
                <input
                  className={styles.input}
                  name="email"
                  type="email"
                  placeholder="alex.h@flowboard.io"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              className={styles.switchLink}
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Official Google "G" logo as an inline SVG — no external dependency needed */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
