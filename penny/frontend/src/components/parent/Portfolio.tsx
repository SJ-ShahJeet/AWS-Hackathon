import type { PortfolioHolding } from '../../lib/mockData';

export default function Portfolio({ holdings, childName }: { holdings: PortfolioHolding[]; childName: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span>💼</span> {childName}'s Portfolio
      </h2>
      {holdings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-slate-500 text-sm">No investments yet</p>
          <p className="text-slate-400 text-xs mt-1">Approve an investment request to get Sophie started</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="pb-3 font-medium">Stock</th>
              <th className="pb-3 font-medium text-right">Shares</th>
              <th className="pb-3 font-medium text-right">Value</th>
              <th className="pb-3 font-medium text-right">Gain/Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holdings.map((h) => (
              <tr key={h.ticker}>
                <td className="py-3">
                  <span className="font-semibold text-slate-900">{h.ticker}</span>
                  <span className="text-slate-400 ml-2">{h.companyName}</span>
                </td>
                <td className="py-3 text-right text-slate-700">{h.shares}</td>
                <td className="py-3 text-right font-medium">${h.currentValue.toFixed(2)}</td>
                <td className={`py-3 text-right font-semibold ${h.gainLossPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {h.gainLossPct >= 0 ? '+' : ''}{h.gainLossPct.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
