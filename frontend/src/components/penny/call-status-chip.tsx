"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-amber-100 text-amber-800 border-amber-200",
  active: "bg-sky-100 text-sky-800 border-sky-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  declined: "bg-rose-100 text-rose-700 border-rose-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  no_answer: "bg-stone-200 text-stone-700 border-stone-300",
};

export function CallStatusChip({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full capitalize ${STATUS_STYLES[status] || "bg-stone-100 text-stone-700 border-stone-200"}`}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
