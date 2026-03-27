"use client";

import { ShieldCheck, TrendingUp } from "lucide-react";

import type { RecommendationBundle } from "@/lib/api";
import { Card } from "@/components/ui/card";

function dollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function RecommendationStack({
  bundle,
  title,
}: {
  bundle: RecommendationBundle;
  title?: string;
}) {
  return (
    <Card className="rounded-[2rem] border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,246,229,0.92))] p-6 shadow-[0_18px_50px_rgba(120,53,15,0.1)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            {title || "Penny's 3 Picks"}
          </div>
          <h3 className="mt-1 text-2xl font-semibold text-stone-950">
            {dollars(bundle.recommendation.total_value_cents)} ready to teach compound growth
          </h3>
        </div>
        <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-stone-600">
          {bundle.recommendation.status.replaceAll("_", " ")}
        </div>
      </div>

      <p className="mb-5 max-w-3xl text-sm leading-relaxed text-stone-600">
        {bundle.recommendation.summary}
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {bundle.options.map((option) => (
          <div
            key={option.id}
            className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 shadow-[0_10px_25px_rgba(120,53,15,0.06)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  {option.symbol}
                </div>
                <div className="text-lg font-semibold text-stone-950">
                  {option.name}
                </div>
              </div>
              <div className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {option.allocation_percent}%
              </div>
            </div>
            <div className="space-y-2 text-sm text-stone-600">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" />
                {option.risk_level} risk
              </div>
              <p>{option.rationale}</p>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {option.interest_match}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
