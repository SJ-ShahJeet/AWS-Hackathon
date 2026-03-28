import { useEffect, useState, createContext, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import ParentDashboard from './pages/ParentDashboard';
import ChildDashboard from './pages/ChildDashboard';
import CareDashboard from './pages/care/CareDashboard';
import { setAuthToken } from './lib/api';

const AUTH0_ROLES_CLAIM = 'https://penny-app/roles';
const AUTH0_CONFIGURED = Boolean(import.meta.env.VITE_AUTH0_DOMAIN);

// ── Role helpers (sessionStorage) ────────────────────────────────────────────
export function getDemoRole(): 'parent' | 'child' | null {
  return (sessionStorage.getItem('demo_role') as 'parent' | 'child') || null;
}

export function setDemoRole(role: 'parent' | 'child') {
  sessionStorage.setItem('demo_role', role);
}

export function clearDemoRole() {
  sessionStorage.removeItem('demo_role');
}

// ── Auth context ─────────────────────────────────────────────────────────────
interface AuthContextValue {
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  logout: () => {
    clearDemoRole();
    setAuthToken(null);
    window.location.href = '/login';
  },
});

export function useAppAuth() {
  return useContext(AuthContext);
}

// ── App with Auth0 (rendered inside Auth0Provider) ───────────────────────────
function AppWithAuth0() {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently, logout } = useAuth0();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return; // Auth0 SDK still processing callback

    if (isAuthenticated && user) {
      console.log('[Auth0] authenticated:', user.email);
      const roles: string[] = user[AUTH0_ROLES_CLAIM] || [];
      console.log('[Auth0] roles:', roles);

      let role: 'parent' | 'child' | null = null;
      if (roles.includes('parent')) role = 'parent';
      else if (roles.includes('child')) role = 'child';

      if (role) {
        setDemoRole(role);
      } else {
        console.warn('[Auth0] no parent/child role found in token');
      }

      getAccessTokenSilently()
        .then((token) => {
          setAuthToken(token);
          console.log('[Auth0] access token set');
          if (role) {
            navigate(role === 'parent' ? '/parent' : '/child', { replace: true });
          }
        })
        .catch((err) => console.warn('[Auth0] token error:', err))
        .finally(() => setReady(true));
    } else {
      // Not authenticated — clear any stale role
      setReady(true);
    }
  }, [isLoading, isAuthenticated, user, getAccessTokenSilently, navigate]);

  const handleLogout = () => {
    clearDemoRole();
    setAuthToken(null);
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  if (isLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 animate-pulse text-lg">Signing in...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      <AppRoutes />
    </AuthContext.Provider>
  );
}

// ── App without Auth0 (demo mode only) ───────────────────────────────────────
function AppWithoutAuth0() {
  const handleLogout = () => {
    clearDemoRole();
    setAuthToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      <AppRoutes />
    </AuthContext.Provider>
  );
}

// ── Shared routes ────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/parent" element={<ProtectedParent />} />
      <Route path="/child" element={<ProtectedChild />} />
      <Route path="/care" element={<ProtectedCare />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootRedirect() {
  const role = getDemoRole();
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'parent' ? '/parent' : '/child'} replace />;
}

function ProtectedParent() {
  const role = getDemoRole();
  if (!role) return <Navigate to="/login" replace />;
  if (role !== 'parent') return <Navigate to="/child" replace />;
  return <ParentDashboard />;
}

function ProtectedChild() {
  const role = getDemoRole();
  if (!role) return <Navigate to="/login" replace />;
  if (role !== 'child') return <Navigate to="/parent" replace />;
  return <ChildDashboard />;
}

function ProtectedCare() {
  const role = getDemoRole();
  if (!role) return <Navigate to="/login" replace />;
  return <CareDashboard />;
}

// ── Top-level App ────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      {AUTH0_CONFIGURED ? <AppWithAuth0 /> : <AppWithoutAuth0 />}
    </BrowserRouter>
  );
}
