"use client";
import { Badge } from "@/components/ui/badge";

const EMOTION_ICONS: Record<string, string> = {
  frustrated: "😤",
  angry: "😠",
  confused: "😕",
  worried: "😟",
  neutral: "😐",
  urgent: "🚨",
};

export function EmotionBadge({ emotion }: { emotion: string }) {
  const icon = EMOTION_ICONS[emotion] || "❓";
  return (
    <Badge variant="outline" className="text-xs gap-1">
      <span>{icon}</span>
      <span className="capitalize">{emotion}</span>
    </Badge>
  );
}
