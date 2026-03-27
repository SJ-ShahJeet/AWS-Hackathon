import type { NegotiationResult as NR } from '../../lib/mockData';

const recConfig = {
  approve: { label: 'Approve Recommended', color: 'text-green-700 bg-green-100', icon: '✅' },
  reject: { label: 'Reject Recommended', color: 'text-red-700 bg-red-100', icon: '❌' },
  negotiate: { label: 'Open to Negotiation', color: 'text-amber-700 bg-amber-100', icon: '🤝' },
};

export default function NegotiationResult({ data }: { data: NR }) {
  const rec = recConfig[data.recommendation];
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">🤖 Penny's Analysis</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rec.color}`}>
          {rec.icon} {rec.label}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Confidence Score</span>
          <span className="font-semibold text-slate-700">{data.confidenceScore}/100</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${data.confidenceScore}%` }} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">Sophie's Argument</p>
        <p className="text-sm text-slate-700 italic">"{data.childArgument}"</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
        <span>⚠️</span>
        <p className="text-xs text-amber-800">{data.diversificationWarning}</p>
      </div>
    </div>
  );
}
