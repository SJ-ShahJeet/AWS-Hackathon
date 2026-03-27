"use client";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  intake: { label: "Intake", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  analyzing: { label: "Analyzing", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse" },
  planning: { label: "Planning", className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 animate-pulse" },
  executing: { label: "Executing", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 animate-pulse" },
  verifying: { label: "Verifying", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300 animate-pulse" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  escalated: { label: "Escalated", className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export function StatusChip({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-700" };
  return <Badge variant="outline" className={`text-xs font-medium border-0 ${config.className}`}>{config.label}</Badge>;
}
