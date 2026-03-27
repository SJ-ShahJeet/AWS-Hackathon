"use client";
import { Badge } from "@/components/ui/badge";

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  critical: { label: "Critical", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const config = SEVERITY_CONFIG[severity] || { label: severity, className: "" };
  return <Badge variant="outline" className={`text-xs font-medium border-0 ${config.className}`}>{config.label}</Badge>;
}
