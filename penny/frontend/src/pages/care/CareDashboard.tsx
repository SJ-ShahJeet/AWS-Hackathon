import { useState, useEffect } from 'react';
import { careApi } from '../../lib/care/api';
import type { DashboardData, CallSession, RecommendationBundle, ApprovalRequest } from '../../lib/care/api';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700',
    approved: 'bg-emerald-100 text-emerald-700',
    active: 'bg-blue-100 text-blue-700',
    queued: 'bg-amber-100 text-amber-700',
    pending: 'bg-amber-100 text-amber-700',
    declined: 'bg-red-100 text-red-600',
    failed: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function RecommendationCard({ bundle }: { bundle: RecommendationBundle }) {
  const { recommendation, options } = bundle;
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-stone-900">Investment Recommendations</h3>
        <StatusBadge status={recommendation.status} />
      </div>
      <p className="text-sm text-stone-500 mb-4">${(recommendation.total_value_cents / 100).toFixed(2)} total</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => (
          <div key={opt.id} className="bg-white rounded-xl border border-amber-100 p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-stone-900">{opt.symbol}</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{opt.allocation_percent}%</span>
            </div>
            <p className="text-xs text-stone-500">{opt.name}</p>
            <p className="text-xs text-stone-400 mt-1">{opt.rationale}</p>
            <div className="flex gap-1 mt-2">
              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{opt.risk_level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CallList({ calls }: { calls: CallSession[] }) {
  if (!calls.length) return <p className="text-stone-400 text-sm">No calls yet.</p>;
  return (
    <div className="space-y-2">
      {calls.map((call) => (
        <div key={call.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-3 hover:bg-slate-50">
          <div>
            <span className="font-medium text-stone-900 text-sm capitalize">{call.call_type} call</span>
            {call.summary && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{call.summary}</p>}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={call.status} />
            <span className="text-xs text-stone-400">{new Date(call.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CareDashboard() {
  // useAppAuth available if needed for Penny logout
  const [data, setData] = useState<DashboardData | null>(null);
  const [phone, setPhone] = useState('');
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState('');
  const [careLoggedIn, setCareLoggedIn] = useState(!!localStorage.getItem('penny_token'));
  const [loggingIn, setLoggingIn] = useState(false);

  const demoLogin = async (email: string, role: string) => {
    setLoggingIn(true);
    try {
      const res = await careApi.demoLogin(email, role);
      localStorage.setItem('penny_token', res.token);
      setCareLoggedIn(true);
    } catch {
      setError('Demo login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const fetchDashboard = () => {
    careApi.getDashboard().then((raw: unknown) => {
      const r = raw as Record<string, unknown>;
      // API returns {role, child: {...}} or {role, parent: {...}} or {role, admin: {...}}
      const role = r.role as string;
      const inner = (r[role] || r) as Record<string, unknown>;
      const normalized: DashboardData = {
        user: (inner.user || r.user || { role }) as DashboardData['user'],
        profile: inner.profile as DashboardData['profile'],
        chores: (inner.chores || []) as DashboardData['chores'],
        recommendations: (inner.recommendations || []) as DashboardData['recommendations'],
        calls: (inner.calls || []) as DashboardData['calls'],
        children: (inner.children || []) as DashboardData['children'],
        approvals: (inner.approvals || r.approvals || []) as DashboardData['approvals'],
        total_calls: (inner.total_calls ?? r.total_calls ?? 0) as number,
        support_calls: (inner.support_calls ?? r.support_calls ?? 0) as number,
        approval_calls: (inner.approval_calls ?? r.approval_calls ?? 0) as number,
        pending_approvals: (inner.pending_approvals ?? r.pending_approvals ?? 0) as number,
        recent_calls: (inner.recent_calls || r.recent_calls || []) as DashboardData['recent_calls'],
        traces: (inner.traces || r.traces || []) as DashboardData['traces'],
      };
      setData(normalized);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const startCall = async () => {
    if (!phone.trim()) return;
    setCalling(true);
    setError('');
    try {
      await careApi.startSupportCall(phone);
      fetchDashboard();
    } catch (e) {
      setError('Failed to start call');
    } finally {
      setCalling(false);
    }
  };

  const handleApproval = async (approval: ApprovalRequest, decision: 'approved' | 'declined') => {
    try {
      await careApi.updateApproval(approval.id, decision);
      fetchDashboard();
    } catch {
      setError('Failed to update approval');
    }
  };

  if (!careLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪙</span>
              <span className="font-bold text-xl text-[#1E3A5F]">Penny</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400 text-sm">Customer Care</span>
            </div>
            <a href="/" className="text-sm text-slate-400 hover:text-slate-600">Back to app</a>
          </div>
        </header>
        <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Customer Care Login</h2>
          <p className="text-stone-500 text-sm mb-6">Select a demo account to enter customer care</p>
          <div className="space-y-3">
            <button onClick={() => demoLogin('maya@demo.com', 'child')} disabled={loggingIn}
              className="w-full bg-amber-50 hover:bg-amber-100 text-stone-700 font-medium py-3 px-4 rounded-xl transition-colors">
              👧 Maya (Child) — Call Penny for help
            </button>
            <button onClick={() => demoLogin('nina@demo.com', 'parent')} disabled={loggingIn}
              className="w-full bg-slate-100 hover:bg-slate-200 text-stone-700 font-medium py-3 px-4 rounded-xl transition-colors">
              👩 Nina (Parent) — Approve investments
            </button>
            <button onClick={() => demoLogin('ops@demo.com', 'admin')} disabled={loggingIn}
              className="w-full bg-violet-50 hover:bg-violet-100 text-stone-700 font-medium py-3 px-4 rounded-xl transition-colors">
              🔧 Ops (Admin) — Monitor calls & traces
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 animate-pulse">Loading customer care...</p>
      </div>
    );
  }

  const isParent = data.user?.role === 'parent';
  const isAdmin = data.user?.role === 'admin';

  const careLogout = () => {
    localStorage.removeItem('penny_token');
    setCareLoggedIn(false);
    setData(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪙</span>
            <span className="font-bold text-xl text-[#1E3A5F]">Penny</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400 text-sm">Customer Care</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-slate-400 hover:text-slate-600">Back to app</a>
            <button onClick={careLogout} className="text-sm text-slate-400 hover:text-slate-600">Switch account</button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
          <span>📞</span> Customer Care
        </h2>
        <p className="text-stone-500 text-sm mt-1">
          {isAdmin ? 'Operations console — monitor all calls and traces' :
           isParent ? 'Review approvals and manage calls' :
           'Talk to Penny for help with your account'}
        </p>
      </div>

      {/* Admin stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Calls', value: data.total_calls ?? 0 },
            { label: 'Support', value: data.support_calls ?? 0 },
            { label: 'Approval', value: data.approval_calls ?? 0 },
            { label: 'Pending', value: data.pending_approvals ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-stone-900">{s.value}</p>
              <p className="text-xs text-stone-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Child: balance + call */}
      {!isParent && !isAdmin && data.profile && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-stone-500 text-sm">Balance</p>
              <p className="text-3xl font-bold text-stone-900">${(data.profile.balance_cents / 100).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-stone-500 text-sm">Coins</p>
              <p className="text-2xl font-bold text-amber-600">{data.profile.coin_balance}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              onClick={startCall}
              disabled={calling || !phone.trim()}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl text-sm"
            >
              {calling ? 'Calling...' : 'Call Penny'}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations?.map((b) => (
        <RecommendationCard key={b.recommendation.id} bundle={b} />
      ))}

      {/* Parent: children + approvals */}
      {isParent && data.children?.map((child) => (
        <div key={child.user.id} className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-stone-900 mb-3">{child.user.name}</h3>
          {child.recommendations?.map((b) => (
            <div key={b.recommendation.id}>
              <RecommendationCard bundle={b} />
              {b.approval && b.approval.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleApproval(b.approval!, 'approved')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-xl text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(b.approval!, 'declined')}
                    className="border border-red-200 text-red-500 hover:bg-red-50 font-medium px-4 py-2 rounded-xl text-sm"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Approvals list (admin) */}
      {isAdmin && data.approvals && data.approvals.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-stone-900 mb-3">Approval Outcomes</h3>
          <div className="space-y-2">
            {data.approvals.map((a) => (
              <div key={a.id} className="flex justify-between border border-slate-100 rounded-xl p-3">
                <span className="text-sm text-stone-700 font-mono">{a.id.slice(0, 8)}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {a.resolution_note && <span className="text-xs text-stone-400">{a.resolution_note}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call history */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-stone-900 mb-3">Call History</h3>
        <CallList calls={data.calls || data.recent_calls || []} />
      </div>

      {/* Traces (admin) */}
      {isAdmin && data.traces && data.traces.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-stone-900 mb-3">Traces</h3>
          <div className="space-y-2">
            {data.traces.slice(0, 20).map((t) => (
              <div key={t.id} className="flex justify-between border border-slate-100 rounded-xl p-3">
                <div>
                  <span className="text-sm font-medium text-stone-900">{t.operation}</span>
                  <p className="text-xs text-stone-400">{t.service} · {t.duration_ms}ms</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
