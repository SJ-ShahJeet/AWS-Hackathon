interface Props { balance: number; threshold: number }

export default function CoinBalance({ balance, threshold }: Props) {
  const pct = Math.min((balance / threshold) * 100, 100);
  const remaining = Math.max(threshold - balance, 0);
  const reached = balance >= threshold;

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-3xl shadow-md">🪙</div>
        <div>
          <p className="text-stone-500 text-sm font-medium">Your Savings</p>
          <p className="text-5xl font-black text-stone-900">${balance.toFixed(2)}</p>
        </div>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-sm font-medium mb-1">
          <span className="text-stone-500">Towards first investment</span>
          <span className={reached ? 'text-emerald-600 font-bold' : 'text-stone-400'}>${threshold} goal</span>
        </div>
        <div className="h-4 bg-amber-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-emerald-500' : 'bg-violet-600'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {reached ? (
        <p className="text-emerald-600 font-bold text-base mt-2">🎉 You hit your goal! Talk to Penny about investing!</p>
      ) : (
        <p className="text-stone-500 text-sm mt-1">
          You're <span className="font-bold text-violet-700">${remaining.toFixed(2)}</span> away from your first investment!
        </p>
      )}
    </div>
  );
}
