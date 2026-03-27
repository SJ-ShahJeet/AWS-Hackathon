import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import ParentDashboard from './pages/ParentDashboard';
import ChildDashboard from './pages/ChildDashboard';
import { setAuthToken } from './lib/api';

const AUTH0_ROLES_CLAIM = 'https://penny-app/roles';
const AUTH0_CONFIGURED = Boolean(import.meta.env.VITE_AUTH0_DOMAIN);

// ── Role helpers (sessionStorage for demo mode) ──────────────────────────────
export function getDemoRole(): 'parent' | 'child' | null {
  return (sessionStorage.getItem('demo_role') as 'parent' | 'child') || null;
}

export function setDemoRole(role: 'parent' | 'child') {
  sessionStorage.setItem('demo_role', role);
}

export function clearDemoRole() {
  sessionStorage.removeItem('demo_role');
}

// ── Inner app (always inside BrowserRouter, optionally inside Auth0Provider) ─
function AppInner() {
  const navigate = useNavigate();

  // Auth0 hooks — safe because this component only renders inside Auth0Provider
  // when AUTH0_CONFIGURED is true (see main.tsx), otherwise we skip them
  const auth0 = AUTH0_CONFIGURED ? useAuth0() : null;
  const isAuth0Loading = auth0?.isLoading ?? false;
  const isAuthenticated = auth0?.isAuthenticated ?? false;
  const auth0User = auth0?.user;
  const getToken = auth0?.getAccessTokenSilently;
  const [ready, setReady] = useState(!AUTH0_CONFIGURED); // if no Auth0, ready immediately

  // Process Auth0 callback and sync role + token
  useEffect(() => {
    if (!AUTH0_CONFIGURED) return;
    if (isAuth0Loading) return; // still processing callback

    if (isAuthenticated && auth0User) {
      console.log('[Auth0] authenticated user:', auth0User.email);
      console.log('[Auth0] claims:', JSON.stringify(auth0User));

      const roles: string[] = auth0User[AUTH0_ROLES_CLAIM] || [];
      console.log('[Auth0] roles:', roles);

      if (roles.includes('parent')) {
        setDemoRole('parent');
        navigate('/parent', { replace: true });
      } else if (roles.includes('child')) {
        setDemoRole('child');
        navigate('/child', { replace: true });
      } else {
        console.warn('[Auth0] no parent/child role found — check Auth0 roles + Login Action');
        // Still authenticated but no role — go to login with a message
        navigate('/login', { replace: true });
      }

      // Get access token for API calls
      if (getToken) {
        getToken()
          .then((token) => {
            setAuthToken(token);
            console.log('[Auth0] access token set');
          })
          .catch((err) => console.warn('[Auth0] token error:', err));
      }
    }

    setReady(true);
  }, [isAuth0Loading, isAuthenticated, auth0User, getToken, navigate]);

  // Show nothing while Auth0 SDK is processing the callback
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 animate-pulse">Signing in...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/parent" element={<ProtectedParent />} />
      <Route path="/child" element={<ProtectedChild />} />
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

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
