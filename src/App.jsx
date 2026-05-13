import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './components/Settings/Settings';
import MyTasks from './components/MyTasks/MyTasks';
import AuthPage from './pages/AuthPage/AuthPage';
import Dashboard from './pages/Dashboard/Dashboard';
import WorkspacePage from './pages/WorkspacePage/WorkspacePage';
import BoardPage from './pages/BoardPage/BoardPage';
import AdminPage from './pages/AdminPage/AdminPage';
import PublicDashboard from './pages/PublicDashboard/PublicDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BoardProvider } from './context/BoardContext';
import './App.css';

function OAuthSuccess() {
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState('Processing Google login...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('Google login failed. No token was returned.');
      return;
    }

    loginWithToken(token)
      .then(() => {
        window.history.replaceState({}, '', '/dashboard');
        window.location.assign('/dashboard');
      })
      .catch(() => {
        setStatus('Failed to load your profile. Please try again.');
      });
  }, [loginWithToken]);

  return <div className="center-screen">{status}</div>;
}

function AppLayout() {
  return (
    <BoardProvider>
      <div className="app-shell">
        <Navbar />
        <div className="app-body">
          <Sidebar />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </BoardProvider>
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center-screen">Loading...</div>;
  if (user) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  }

  return <AuthPage />;
}

function DefaultRoute() {
  const { user, loading, isPlatformAdmin } = useAuth();

  if (loading) return <div className="center-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isPlatformAdmin ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/" element={<DefaultRoute />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/public-dashboard" element={<PublicDashboard />} />
              <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
              <Route path="/boards/:boardId" element={<BoardPage />} />
              <Route path="/tasks" element={<MyTasks />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute requirePlatformAdmin />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
