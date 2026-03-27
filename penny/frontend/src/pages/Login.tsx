import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { setDemoRole } from '../App';

const AUTH0_CONFIGURED = Boolean(import.meta.env.VITE_AUTH0_DOMAIN);

// Only rendered (and hook only runs) when Auth0Provider wraps the app
function Auth0LoginButton() {
  const { loginWithRedirect, isLoading, error } = useAuth0();
  console.log('[Auth0LoginButton] isLoading:', isLoading, 'error:', error);
  return (
    <button
      onClick={() => {
        console.log('[Auth0LoginButton] clicked, calling loginWithRedirect');
        loginWithRedirect().catch((e) => console.error('[Auth0LoginButton] loginWithRedirect error:', e));
      }}
      className="block w-full bg-[#1E3A5F] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#162d4a] transition-colors mb-6"
    >
      Sign In with Auth0
    </button>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const enterAs = (role: 'parent' | 'child') => {
    console.log('[FRONTEND][Login] demo role selected', { role });
    setDemoRole(role);
    navigate(role === 'parent' ? '/parent' : '/child');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="text-5xl mb-4">🪙</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Penny</h1>
        <p className="text-slate-500 mb-8">Financial literacy for the next generation</p>

        {AUTH0_CONFIGURED ? (
          <Auth0LoginButton />
        ) : (
          <button
            disabled
            className="block w-full bg-slate-300 text-slate-500 font-semibold py-3 px-6 rounded-xl mb-6 cursor-not-allowed"
          >
            Sign In with Auth0 (configure .env)
          </button>
        )}

        {/* Demo shortcuts — always available */}
        <div className="border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400 mb-3 uppercase tracking-wide">Demo — No login required</p>
          <div className="flex gap-3">
            <button
              onClick={() => enterAs('parent')}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              👨‍👩‍👧 Parent View
            </button>
            <button
              onClick={() => enterAs('child')}
              className="flex-1 bg-amber-50 hover:bg-amber-100 text-violet-700 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              👧 Child View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
