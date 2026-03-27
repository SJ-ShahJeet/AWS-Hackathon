"use client";

import type { TraceSpan } from "@/lib/api";

export function TraceList({ traces }: { traces: TraceSpan[] }) {
  if (traces.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">
        No traces recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {traces.map((trace) => (
        <div
          key={trace.id}
          className="rounded-[1.25rem] border border-stone-200 bg-white/85 px-4 py-3 text-sm shadow-[0_8px_20px_rgba(120,53,15,0.05)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium text-stone-900">{trace.operation}</div>
            <div className="text-xs uppercase tracking-[0.16em] text-stone-500">
              {trace.status}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
            <span>{trace.service}</span>
            {trace.duration_ms != null ? <span>{trace.duration_ms}ms</span> : null}
            <span>{new Date(trace.start_time).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
