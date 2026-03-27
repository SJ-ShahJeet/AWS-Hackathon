"use client";

import type { ChoreLedgerEntry } from "@/lib/api";

function dollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function LedgerList({ chores }: { chores: ChoreLedgerEntry[] }) {
  return (
    <div className="space-y-3">
      {chores.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-stone-200 bg-white/80 px-4 py-3"
        >
          <div>
            <div className="text-sm font-medium text-stone-900">
              {entry.description}
            </div>
            <div className="text-xs text-stone-500">
              {new Date(entry.completed_at).toLocaleDateString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-amber-700">
              +{entry.coins_earned} coins
            </div>
            <div className="text-xs text-stone-500">
              {dollars(entry.amount_cents)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
