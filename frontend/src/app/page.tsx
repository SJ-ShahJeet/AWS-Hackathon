"use client";

import Link from "next/link";
import { ArrowRight, Coins, PhoneCall, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { routeForRole } from "@/lib/utils";

const PILLARS = [
  {
    title: "Kid-friendly support",
    copy: "Penny answers questions like a calm friend on the phone instead of making kids read a wall of finance text.",
    icon: PhoneCall,
  },
  {
    title: "Grounded answers",
    copy: "Every live answer is grounded in household balances, recommendation data, and Ghost-backed knowledge notes.",
    icon: Sparkles,
  },
  {
    title: "Parent control",
    copy: "Approval still belongs to the parent, whether they answer the Bland call or use the dashboard fallback.",
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  const user = useAuth((s) => s.user);
  const destination = routeForRole(user?.role);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7dc_0%,#fff8ef_38%,#fdebd9_100%)]">
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 shadow-[0_12px_30px_rgba(245,158,11,0.12)]">
                <Sparkles className="h-4 w-4" />
                Penny Customer Care
              </div>
              <h1 className="max-w-3xl font-[family:var(--font-heading)] text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-stone-950 sm:text-6xl">
                Teaching money through conversation, care, and parent-safe calls.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">
                Kids earn coins from chores, hit the $50 threshold, and talk to Penny like a real guide. Penny explains the starter investment mix, answers questions on a live call, and asks the parent for approval before anything moves forward.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={user ? destination : "/login"}>
                  <Button size="lg" className="rounded-full px-6 text-base">
                    {user ? "Open Dashboard" : "Launch Penny"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-stone-300 bg-white/80 px-6 text-base"
                  >
                    Try Demo Accounts
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 top-8 h-40 rounded-full bg-amber-300/30 blur-3xl" />
              <div className="relative rounded-[2.5rem] border border-amber-200/70 bg-white/85 p-6 shadow-[0_26px_80px_rgba(120,53,15,0.14)] backdrop-blur-xl">
                <div className="rounded-[2rem] bg-[linear-gradient(135deg,#ffda77,#ffb86a,#f8efe0)] p-6 text-stone-900">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-white/70 shadow-inner">
                    <Coins className="h-7 w-7" />
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">
                    Live Demo Flow
                  </div>
                  <div className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                    $63.00 ready
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-stone-700">
                    Penny recommends 3 beginner-friendly options, explains why they fit the child, and can place a parent approval call instantly.
                  </p>
                </div>

                <div className="mt-6 grid gap-3">
                  {[
                    "1. Child signs in and reviews balance + Penny picks",
                    "2. Call button launches Bland support call",
                    "3. Penny answers with Ghost + NIM grounded context",
                    "4. Parent receives approval call or approves manually",
                  ].map((step) => (
                    <div
                      key={step}
                      className="rounded-[1.5rem] border border-stone-200 bg-[#fffaf2] px-4 py-3 text-sm text-stone-700"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-[0_16px_45px_rgba(120,53,15,0.08)]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <pillar.icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-stone-950">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {pillar.copy}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[2rem] border border-stone-200 bg-white/70 p-6 shadow-[0_16px_45px_rgba(120,53,15,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Powered By
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-600">
                <span className="rounded-full bg-[#fff1dc] px-3 py-1">React + FastAPI</span>
                <span className="rounded-full bg-[#fff1dc] px-3 py-1">Auth0 RBAC</span>
                <span className="rounded-full bg-[#fff1dc] px-3 py-1">Ghost Postgres</span>
                <span className="rounded-full bg-[#fff1dc] px-3 py-1">Bland Calls</span>
                <span className="rounded-full bg-[#fff1dc] px-3 py-1">NVIDIA NIM Qwen</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <TrendingUp className="h-4 w-4" />
              Compound interest, but friendly
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
