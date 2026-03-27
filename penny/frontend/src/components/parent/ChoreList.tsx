import { useState } from 'react';
import type { Chore, ChoreStatus } from '../../lib/mockData';
import { api } from '../../lib/api';

interface Props {
  chores: Chore[];
  onBalanceChange: (newBalance: number) => void;
  currentBalance: number;
}

export default function ChoreList({ chores, onBalanceChange, currentBalance }: Props) {
  const [statuses, setStatuses] = useState<Record<string, ChoreStatus>>(
    Object.fromEntries(chores.map((c) => [c.id, c.status]))
  );
  const [proofModal, setProofModal] = useState<string | null>(null);

  const approve = async (chore: Chore) => {
    console.log('[PARENT][ChoreList] approve clicked', { choreId: chore.id, reward: chore.reward });
    setStatuses((s) => ({ ...s, [chore.id]: 'approved' }));
    const next = currentBalance + chore.reward;
    onBalanceChange(next);
    console.log('[PARENT][ChoreList] balance updated', { prev: currentBalance, next });
    await api.chores.approve(chore.id, chore.reward);
  };

  const reject = async (chore: Chore) => {
    console.log('[PARENT][ChoreList] reject clicked', { choreId: chore.id });
    setStatuses((s) => ({ ...s, [chore.id]: 'rejected' }));
    await api.chores.reject(chore.id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span>📋</span> Chore Approvals
      </h2>

      {chores.length === 0 && <p className="text-slate-400 text-sm">No pending chores.</p>}

      <div className="space-y-3">
        {chores.map((chore) => {
          const status = statuses[chore.id];
          return (
            <div
              key={chore.id}
              className={`border rounded-xl p-4 transition-colors ${
                status === 'approved' ? 'border-green-200 bg-green-50'
                : status === 'rejected' ? 'border-red-100 bg-red-50'
                : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900">{chore.title}</span>
                    <span className="text-sm font-bold text-green-600">+${chore.reward}</span>
                    {status === 'approved' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Approved</span>
                    )}
                    {status === 'rejected' && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Rejected</span>
                    )}
                  </div>
                  {chore.description && (
                    <p className="text-sm text-slate-500 mt-1">{chore.description}</p>
                  )}
                  {chore.proofImageUrl && (
                    <button
                      onClick={() => setProofModal(chore.proofImageUrl!)}
                      className="text-xs text-blue-600 hover:underline mt-1"
                    >
                      📷 View proof photo
                    </button>
                  )}
                </div>
                {status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => approve(chore)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reject(chore)}
                      className="border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {proofModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setProofModal(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full mx-4">
            <img src={proofModal} alt="Chore proof" className="w-full rounded-xl" />
            <button onClick={() => setProofModal(null)} className="mt-3 w-full text-slate-500 text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
