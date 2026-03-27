import type { PortfolioHolding } from '../../lib/mockData';

export default function Portfolio({ holdings }: { holdings: PortfolioHolding[] }) {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-6">
      <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2"><span>📈</span> My Portfolio</h2>

      {holdings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-5xl mb-3">🌱</p>
          <p className="text-stone-700 font-bold text-lg">Your portfolio is empty</p>
          <p className="text-stone-400 text-sm mt-2 max-w-xs mx-auto">
            Talk to Penny to make your first investment once you hit your $50 goal!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-amber-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-stone-600 font-medium">Total Value</span>
            <span className="text-2xl font-black text-stone-900">${total.toFixed(2)}</span>
          </div>
          {holdings.map((h) => {
            const pct = total > 0 ? (h.currentValue / total) * 100 : 0;
            return (
              <div key={h.ticker} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-stone-900 text-lg">{h.ticker}</span>
                    <span className="text-stone-400 ml-2 text-sm">{h.companyName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-stone-900">${h.currentValue.toFixed(2)}</p>
                    <p className={`text-sm font-semibold ${h.gainLossPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {h.gainLossPct >= 0 ? '+' : ''}{h.gainLossPct.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-stone-400 mt-1">{pct.toFixed(0)}% of portfolio · {h.shares} shares</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
