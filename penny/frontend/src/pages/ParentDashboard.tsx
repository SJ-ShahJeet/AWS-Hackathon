import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SOPHIE_INVESTMENT } from '../lib/mockData';
import type { Chore, PortfolioHolding } from '../lib/mockData';
import { api } from '../lib/api';

const CHILD_ID = 'sophie-001';
const CHILD_NAME = 'Sophie';
const DEFAULT_THRESHOLD = 50;
import ChoreList from '../components/parent/ChoreList';
import InvestmentApproval from '../components/parent/InvestmentApproval';
import WeeklyReport from '../components/parent/WeeklyReport';
import Portfolio from '../components/parent/Portfolio';

export default function ParentDashboard() {
  const [balance, setBalance] = useState<number>(0);
  const [chores, setChores] = useState<Chore[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const threshold = DEFAULT_THRESHOLD;
  const thresholdReached = balance >= threshold;
  const progressPct = Math.min((balance / threshold) * 100, 100);

  // Load real data from DB on mount
  useEffect(() => {
    console.log('[PARENT][Dashboard] loading data from API');
    Promise.all([
      api.chores.list(CHILD_ID),
      api.chores.balance(CHILD_ID),
      api.investments.portfolio(CHILD_ID),
    ]).then(([choreRes, balanceRes, portfolioRes]) => {
      if (choreRes.success && choreRes.data) {
        const mapped: Chore[] = (choreRes.data as unknown as Record<string, unknown>[]).map((c) => ({
          id: c.id as string,
          childId: c.child_id as string,
          title: c.title as string,
          reward: c.reward as number,
          status: c.status as Chore['status'],
          description: c.description as string | undefined,
          plannedDate: c.planned_date as string | undefined,
          proofImageUrl: c.proof_image_url as string | undefined,
          createdAt: c.created_at as string,
        }));
        setChores(mapped);
        console.log('[PARENT][Dashboard] chores loaded from DB', { count: mapped.length });
      }
      if (balanceRes.success && balanceRes.data) {
        setBalance(balanceRes.data.balance);
        console.log('[PARENT][Dashboard] balance loaded from DB', { balance: balanceRes.data.balance });
      }
      if (portfolioRes.success && portfolioRes.data) {
        const mapped = (portfolioRes.data as Record<string, unknown>[]).map((h) => ({
          ticker: h.ticker as string,
          companyName: h.companyName as string,
          shares: Number(h.shares),
          purchasePrice: Number(h.purchasePrice),
          currentPrice: Number(h.currentPrice),
          currentValue: Number(h.shares) * Number(h.currentPrice),
          gainLossPct: Number(h.purchasePrice) > 0
            ? ((Number(h.currentPrice) - Number(h.purchasePrice)) / Number(h.purchasePrice)) * 100
            : 0,
        }));
        setPortfolio(mapped);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('demo_role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪙</span>
            <span className="font-bold text-xl text-[#1E3A5F]">Penny</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400 text-sm">Parent Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Welcome back</span>
            <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Balance card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-500 text-sm">Sophie's Savings Balance</p>
              <p className="text-4xl font-bold text-[#1E3A5F] mt-1">${balance.toFixed(2)}</p>
              <p className="text-slate-400 text-sm mt-1">Goal: ${threshold.toFixed(0)} — first investment unlock</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Progress</p>
              <p className="text-2xl font-bold text-slate-700">{Math.round(progressPct)}%</p>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${thresholdReached ? 'bg-green-500' : 'bg-[#1E3A5F]'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {thresholdReached && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-xl">🎉</span>
              <p className="text-green-800 font-medium text-sm">
                Sophie has reached her $50 goal! Review her investment request below.
              </p>
            </div>
          )}
        </div>

        {/* Chore approvals */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="animate-pulse text-slate-400">Loading chores from database...</div>
          </div>
        ) : (
          <ChoreList chores={chores} onBalanceChange={setBalance} currentBalance={balance} />
        )}

        {/* Investment approval — only after threshold */}
        {thresholdReached && <InvestmentApproval investment={SOPHIE_INVESTMENT} />}

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Portfolio holdings={portfolio} childName={CHILD_NAME} />
          <WeeklyReport />
        </div>
      </main>
    </div>
  );
}
