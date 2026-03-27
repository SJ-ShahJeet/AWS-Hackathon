"use client";

import Link from "next/link";
import { PhoneCall, ArrowRight, Clock3 } from "lucide-react";

import type { CallSession } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { CallStatusChip } from "@/components/penny/call-status-chip";

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CallList({ calls }: { calls: CallSession[] }) {
  if (calls.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm text-stone-500">
        No calls yet. When Penny places support or approval calls, they will show up here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <Link key={call.id} href={`/calls/${call.id}`}>
          <Card className="rounded-[1.75rem] border-stone-200 bg-white/85 p-5 shadow-[0_12px_35px_rgba(120,53,15,0.08)] transition-all hover:-translate-y-0.5 hover:border-amber-300">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <div className="text-base font-semibold text-stone-900">
                    {call.call_type === "support" ? "Customer Care Call" : "Parent Approval Call"}
                  </div>
                  <CallStatusChip status={call.status} />
                </div>
                <p className="line-clamp-2 text-sm text-stone-600">
                  {call.summary || call.transcript || "Call queued and waiting for more events."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <span>{call.phone_number}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {relativeTime(call.created_at)}
                  </span>
                </div>
              </div>
              <ArrowRight className="mt-2 h-4 w-4 text-amber-500" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
