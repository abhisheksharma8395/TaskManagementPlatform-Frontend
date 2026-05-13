import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../api/authService';
import { decodeJwtClaims, isPlatformAdmin as checkPlatformAdmin, normalizePlatformRole } from '../utils/permissions';

const AuthContext = createContext(null);

function buildSessionUser(profile, token, authRole) {
  const claims = decodeJwtClaims(token);
  const role = authRole || claims?.role || profile?.role || 'USER';

  return {
    ...profile,
    role,
    platformRole: normalizePlatformRole(role),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const cached = localStorage.getItem('user');
    let cancelled = false;

    if (token && cached) {
      try {
        const parsed = JSON.parse(cached);
        const sessionUser = buildSessionUser(parsed, token, parsed.role);
        setUser(sessionUser);

        if (sessionUser.username) {
          authService.getUserByUsername(sessionUser.username)
            .then((profile) => {
              if (cancelled) return;
              const refreshed = buildSessionUser(profile, token, sessionUser.role);
              localStorage.setItem('user', JSON.stringify(refreshed));
              setUser(refreshed);
            })
            .catch(() => {});
        }
      } catch {
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
    return () => { cancelled = true; };
  }, []);

  const persistUser = useCallback((nextUser) => {
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(async (username, password) => {
    const authData = await authService.login({ username, password });
    localStorage.setItem('token', authData.token);

    const profile = await authService.getUserByUsername(authData.username);
    const sessionUser = buildSessionUser(profile, authData.token, authData.role);
    persistUser(sessionUser);
    return sessionUser;
  }, [persistUser]);

  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem('token', token);

    const payload = decodeJwtClaims(token);
    const username = payload?.sub;
    if (!username) throw new Error('Unable to read user from token');

    const profile = await authService.getUserByUsername(username);
    const sessionUser = buildSessionUser(profile, token, payload?.role);
    persistUser(sessionUser);
    return sessionUser;
  }, [persistUser]);

  const register = useCallback(async ({ username, fullName, email, password }) => {
    await authService.register({
      userName: username,
      fullName,
      email,
      password,
      role: 'USER',
    });

    return login(username, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = buildSessionUser({ ...prev, ...updates }, localStorage.getItem('token'), updates.role || prev?.role);
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    role: user?.platformRole || normalizePlatformRole(user?.role),
    isPlatformAdmin: checkPlatformAdmin(user),
    login,
    loginWithToken,
    register,
    logout,
    updateUser,
  }), [loading, login, loginWithToken, logout, register, updateUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
