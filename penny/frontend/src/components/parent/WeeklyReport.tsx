import { WEEKLY_REPORT } from '../../lib/mockData';

export default function WeeklyReport() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <span>📊</span> {WEEKLY_REPORT.title}
      </h2>
      <p className="text-sm text-slate-500 mb-4">{WEEKLY_REPORT.summary}</p>
      <ul className="space-y-2">
        {WEEKLY_REPORT.highlights.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs shrink-0">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
