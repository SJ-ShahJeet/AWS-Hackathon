import { useState } from 'react';
import type { Investment } from '../../lib/mockData';
import { MOCK_NEGOTIATION } from '../../lib/mockData';
import { api } from '../../lib/api';
import NegotiationResult from './NegotiationResult';

type UIState = 'pending' | 'rejecting' | 'rejected' | 'approved';

export default function InvestmentApproval({ investment }: { investment: Investment }) {
  const [uiState, setUiState] = useState<UIState>('pending');
  const [reason, setReason] = useState('');

  const approve = async () => {
    console.log('[PARENT][InvestmentApproval] approve clicked', { ticker: investment.ticker });
    setUiState('approved');
    await api.investments.approve(investment.id);
  };

  const submitReject = async () => {
    if (!reason.trim()) return;
    console.log('[PARENT][InvestmentApproval] rejection submitted', { reason });
    setUiState('rejected');
    await api.investments.reject(investment.id, reason);
  };

  const riskColor = { Low: 'text-green-600 bg-green-100', Moderate: 'text-amber-600 bg-amber-100', High: 'text-red-600 bg-red-100' }[investment.risk];

  if (uiState === 'approved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-green-800">Investment Approved!</p>
          <p className="text-sm text-green-600">Sophie will invest ${investment.amount} in {investment.companyName} ({investment.ticker})</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span>📈</span> Investment Request
      </h2>

      <div className="border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-slate-500 text-sm">Sophie wants to invest</p>
            <p className="text-2xl font-bold text-slate-900">${investment.amount} in {investment.companyName}</p>
            <p className="text-slate-400 text-sm font-mono">{investment.ticker} · {investment.shares} shares</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${riskColor}`}>{investment.risk} Risk</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 text-xs">Projected Return</p>
            <p className="font-semibold text-slate-900">{investment.projectedReturn} / yr</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 text-xs">Simulated Shares</p>
            <p className="font-semibold text-slate-900">{investment.shares} shares</p>
          </div>
        </div>
      </div>

      {uiState === 'pending' && (
        <div className="flex gap-3">
          <button onClick={approve} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors">✅ Approve</button>
          <button onClick={() => setUiState('rejecting')} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors">❌ Reject</button>
        </div>
      )}

      {uiState === 'rejecting' && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Reason (required)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain to Sophie why you're not approving this investment..."
              rows={3}
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
          </label>
          <div className="flex gap-3">
            <button onClick={submitReject} disabled={!reason.trim()} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              Submit Rejection
            </button>
            <button onClick={() => setUiState('pending')} className="px-6 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {uiState === 'rejected' && (
        <div>
          <p className="text-red-600 text-sm font-medium">❌ Rejection submitted.</p>
          <NegotiationResult data={MOCK_NEGOTIATION} />
          <button
            onClick={() => console.log('[PARENT][InvestmentApproval] rejection confirmed')}
            className="mt-4 w-full border border-red-200 text-red-600 font-medium py-2.5 rounded-xl hover:bg-red-50 text-sm"
          >
            Confirm Rejection
          </button>
        </div>
      )}
    </div>
  );
}
