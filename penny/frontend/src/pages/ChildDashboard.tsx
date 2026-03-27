import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Chore } from '../lib/mockData';
import { api } from '../lib/api';
import CoinBalance from '../components/child/CoinBalance';
import PennyAvatar from '../components/child/PennyAvatar';
import ChoreTracker from '../components/child/ChoreTracker';
import ChoreProofUpload from '../components/child/ChoreProofUpload';
import Portfolio from '../components/child/Portfolio';

const CHILD_ID = 'sophie-001';
const CHILD_NAME = 'Sophie';
const DEFAULT_THRESHOLD = 50;

export default function ChildDashboard() {
  const navigate = useNavigate();
  const [chores, setChores] = useState<Chore[]>([]);
  const [balance, setBalance] = useState(0);
  const [threshold] = useState(DEFAULT_THRESHOLD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[CHILD][ChildDashboard] fetching data for', CHILD_ID);
    Promise.all([api.chores.list(CHILD_ID), api.chores.balance(CHILD_ID)])
      .then(([choreRes, balanceRes]) => {
        if (choreRes.success && choreRes.data) {
          const mapped = (choreRes.data as unknown as Record<string, unknown>[]).map((c) => ({
            id: c.id as string,
            childId: (c.child_id ?? c.childId) as string,
            title: c.title as string,
            reward: Number(c.reward),
            status: c.status as Chore['status'],
            description: c.description as string | undefined,
            plannedDate: (c.planned_date ?? c.plannedDate) as string | undefined,
            proofImageUrl: (c.proof_image_url ?? c.proofImageUrl) as string | undefined,
            createdAt: (c.created_at ?? c.createdAt) as string,
          }));
          setChores(mapped);
          console.log('[CHILD][ChildDashboard] chores loaded', mapped.length);
        }
        if (balanceRes.success && balanceRes.data) {
          setBalance(Number(balanceRes.data.balance));
        }
      })
      .catch((err) => console.error('[CHILD][ChildDashboard] load error', err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('demo_role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪙</span>
            <span className="font-black text-xl text-violet-700">Penny</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-4xl font-black text-stone-900">Hey {CHILD_NAME}! 👋</h1>
          <p className="text-stone-500 mt-1">Ready to grow your money?</p>
        </div>

        {/* Balance + Avatar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CoinBalance balance={balance} threshold={threshold} />
          <PennyAvatar />
        </div>

        {/* Chore tracker + Proof upload */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChoreTracker initialChores={chores} onChoreAdded={(c) => setChores((prev) => [c, ...prev])} />
            <ChoreProofUpload />
          </div>
        )}

        {/* Portfolio */}
        <Portfolio holdings={[]} />
      </main>
    </div>
  );
}
