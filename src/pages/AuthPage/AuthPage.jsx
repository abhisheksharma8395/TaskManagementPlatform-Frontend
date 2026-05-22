/**
 * AuthPage.jsx
 * Centered card auth page — Login, Register, Admin login,
 * Forgot Password, and Reset Password.
 * Supports URL query params:
 *   ?mode=register  → opens Create Account tab
 *   ?admin=true     → opens Admin Login tab
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { forgotPassword, resetPassword } from '../../api/authService';
import styles from './AuthPage.module.css';

const API_GATEWAY = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8765';
const GOOGLE_OAUTH_URL = `${API_GATEWAY}/auth-service/oauth2/authorization/google`;

export default function AuthPage() {
  const { login, register, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialMode = searchParams.get('admin') === 'true'
    ? 'admin'
    : searchParams.get('mode') === 'register'
    ? 'register'
    : 'login';

  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (mode === 'register') {
        await register({
          username: form.username,
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        });
      } else if (mode === 'forgot') {
        await forgotPassword({ email: form.email });
        setSuccessMsg('OTP sent! Check your email inbox.');
        // Pre-fill email in reset form and transition after short delay
        setTimeout(() => {
          setSuccessMsg('');
          setMode('reset');
          setForm((prev) => ({ ...prev, otp: '', newPassword: '' }));
        }, 1800);
        return; // skip setLoading(false) until timeout
      } else if (mode === 'reset') {
        await resetPassword({ email: form.email, otp: form.otp, newPassword: form.newPassword });
        setSuccessMsg('Password reset successfully! Redirecting to login…');
        setTimeout(() => {
          setSuccessMsg('');
          switchMode('login');
        }, 2000);
        return;
      } else {
        const sessionUser = await login(form.username, form.password);
        const userRole = (sessionUser?.role || '').toUpperCase();

        if (isAdmin && userRole !== 'ADMIN') {
          // Regular user tried to log in via Admin tab → reject
          logout();
          setError('Access denied. This portal is for platform administrators only. Please use the Sign In tab.');
          return;
        }

        if (!isAdmin && userRole === 'ADMIN') {
          // Admin tried to log in via regular Login tab → reject
          logout();
          setError('Admin accounts must use the 🛡️ Admin portal to sign in.');
          return;
        }
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

  const handleGoogleLogin = () => { window.location.href = GOOGLE_OAUTH_URL; };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setForm({ fullName: '', username: '', email: '', password: '', otp: '', newPassword: '' });
  };

  const isAdmin = mode === 'admin';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';
  const isPasswordFlow = isForgot || isReset;

  return (
    <div className={styles.page}>
      {/* Animated background orbs */}
      <div className={styles.orb1} aria-hidden />
      <div className={styles.orb2} aria-hidden />
      <div className={styles.orb3} aria-hidden />

      {/* Back to landing */}
      <button className={styles.backLink} onClick={() => navigate('/')}>
        ← Back to Home
      </button>

      {/* Centered card */}
      <div className={styles.card}>

        {/* Brand */}
        <div className={styles.brand}>
          <img src="/logo.svg" alt="FlowBoard" width={40} height={40} style={{ display: 'block' }} />
          <span className={styles.brandName}>FlowBoard</span>
        </div>

        {/* Heading */}
        <div className={styles.heading}>
          <h1>
            {isAdmin ? 'Admin Portal'
              : isRegister ? 'Create your account'
              : isForgot ? 'Forgot Password'
              : isReset ? 'Reset Password'
              : 'Welcome back'}
          </h1>
          <p>
            {isAdmin
              ? 'Sign in with your administrator credentials.'
              : isRegister
              ? 'Start managing your team in minutes — free forever.'
              : isForgot
              ? 'Enter your registered email and we\'ll send you an OTP.'
              : isReset
              ? 'Enter the OTP from your email and your new password.'
              : 'Sign in to continue to your workspace.'}
          </p>
        </div>

        {/* Admin notice */}
        {isAdmin && (
          <div className={styles.adminBanner}>
            <span>🛡️</span>
            <span>Platform administrator access only. Regular users should use <strong>Sign In</strong>.</span>
          </div>
        )}

        {/* Tab switcher — hidden during password-reset flow */}
        {!isPasswordFlow && (
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
              Sign Up
            </button>
            <button
              className={`${styles.tab} ${styles.adminTab} ${isAdmin ? styles.activeAdminTab : ''}`}
              onClick={() => switchMode('admin')}
            >
              🛡️ Admin
            </button>
          </div>
        )}

        {/* Google OAuth — user modes only, hidden during password flow */}
        {!isAdmin && !isPasswordFlow && (
          <>
            <button className={styles.googleBtn} onClick={handleGoogleLogin} type="button">
              <GoogleIcon />
              Continue with Google
            </button>
            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>or use your username</span>
              <span className={styles.dividerLine} />
            </div>
          </>
        )}

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>

          {/* ── Forgot Password step 1: email only ── */}
          {isForgot && (
            <div className={styles.field}>
              <label className={styles.label}>Registered Email Address</label>
              <input
                className={styles.input}
                name="email"
                type="email"
                placeholder="alex@flowboard.io"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
          )}

          {/* ── Reset Password step 2: email + OTP + new password ── */}
          {isReset && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Registered Email Address</label>
                <input
                  className={styles.input}
                  name="email"
                  type="email"
                  placeholder="alex@flowboard.io"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>OTP Code</label>
                <input
                  className={`${styles.input} ${styles.otpInput}`}
                  name="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={form.otp}
                  onChange={handleChange}
                  required
                  maxLength={8}
                  autoFocus
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>New Password</label>
                <input
                  className={styles.input}
                  name="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {/* ── Standard login/register fields ── */}
          {!isPasswordFlow && (
            <>
              {isRegister && (
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
                  placeholder={isAdmin ? 'admin_username' : 'alexh'}
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>

              {isRegister && (
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    className={styles.input}
                    name="email"
                    type="email"
                    placeholder="alex@flowboard.io"
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
                {/* Forgot password link — login mode only */}
                {mode === 'login' && (
                  <button
                    type="button"
                    className={styles.forgotLink}
                    onClick={() => switchMode('forgot')}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}
          {successMsg && <div className={styles.successBox}>{successMsg}</div>}

          <button
            type="submit"
            className={isAdmin ? styles.adminSubmitBtn : styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? 'Please wait…'
              : isAdmin
              ? '🛡️ Enter Admin Dashboard'
              : isRegister
              ? 'Create Account'
              : isForgot
              ? 'Send OTP'
              : isReset
              ? 'Reset Password'
              : 'Sign In'}
          </button>
        </form>

        {/* Switch mode / back link */}
        <p className={styles.switchText}>
          {isPasswordFlow ? (
            <>
              Remember your password?{' '}
              <button className={styles.switchLink} onClick={() => switchMode('login')}>
                Back to Sign In
              </button>
            </>
          ) : isRegister ? (
            <>
              Already have an account?{' '}
              <button className={styles.switchLink} onClick={() => switchMode('login')}>Sign in</button>
            </>
          ) : isAdmin ? (
            <>
              Not an admin?{' '}
              <button className={styles.switchLink} onClick={() => switchMode('login')}>User Login</button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button className={styles.switchLink} onClick={() => switchMode('register')}>Sign up free</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

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
