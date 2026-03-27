import { useState } from 'react';
import type { Chore, ChoreStatus } from '../../lib/mockData';
import { api } from '../../lib/api';

const statusConfig: Record<ChoreStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Waiting for approval', color: 'bg-amber-100 text-amber-700', icon: '⏳' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  rejected: { label: 'Not approved', color: 'bg-red-100 text-red-600', icon: '❌' },
};

interface Props {
  initialChores: Chore[];
  onChoreAdded?: (chore: Chore) => void;
}

export default function ChoreTracker({ initialChores, onChoreAdded }: Props) {
  const [chores, setChores] = useState<Chore[]>(initialChores);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addChore = async () => {
    if (!title.trim()) return;
    console.log('[CHILD][ChoreTracker] new chore submitted', { title, plannedDate });
    setSubmitting(true);
    try {
      const res = await api.chores.create({
        title: title.trim(),
        description: description.trim() || undefined,
        plannedDate: plannedDate || undefined,
      });
      if (res.success && res.data) {
        const newChore: Chore = {
          id: res.data.id,
          childId: res.data.childId ?? 'sophie-001',
          title: res.data.title,
          reward: Number(res.data.reward),
          status: res.data.status,
          description: res.data.description,
          plannedDate: res.data.plannedDate,
          createdAt: res.data.createdAt ?? new Date().toISOString(),
        };
        setChores((prev) => [newChore, ...prev]);
        onChoreAdded?.(newChore);
      }
    } catch (err) {
      console.error('[CHILD][ChoreTracker] create error', err);
    } finally {
      setSubmitting(false);
      setTitle(''); setDescription(''); setPlannedDate('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-6">
      <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2"><span>✅</span> My Chores</h2>

      <div className="space-y-3 mb-6">
        {chores.length === 0 && <p className="text-stone-400 text-sm">No chores yet — add one below!</p>}
        {chores.map((chore) => {
          const cfg = statusConfig[chore.status];
          return (
            <div key={chore.id} className="flex items-start gap-3 border border-slate-100 rounded-xl p-3">
              <span className="text-xl mt-0.5">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900">{chore.title}</span>
                  <span className="text-emerald-600 font-bold text-sm">+${chore.reward}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
                {chore.description && <p className="text-sm text-stone-500 mt-0.5 truncate">{chore.description}</p>}
                {chore.plannedDate && <p className="text-xs text-stone-400 mt-0.5">Planned: {chore.plannedDate}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 pt-5 space-y-3">
        <p className="text-sm font-bold text-stone-700">📝 Plan a New Chore</p>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What chore will you do?" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us what you did or plan to do..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        <button onClick={addChore} disabled={!title.trim() || submitting} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
          {submitting ? 'Saving...' : 'Add Chore ✨'}
        </button>
      </div>
    </div>
  );
}
