"use client";

export function ConfidenceMeter({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  const width = size === "sm" ? "w-16" : size === "lg" ? "w-32" : "w-24";
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className="flex items-center gap-2">
      <div className={`${width} ${height} bg-muted rounded-full overflow-hidden`}>
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground font-medium">{pct}%</span>
    </div>
  );
}
