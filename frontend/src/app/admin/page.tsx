"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getDashboard, getHealth } from "@/lib/api";
import { CallList } from "@/components/penny/call-list";
import { TraceList } from "@/components/penny/trace-list";
import { useAuth } from "@/store/auth";
import { routeForRole } from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();
  const { user, hydrated, authLoading } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    enabled: Boolean(user),
    refetchInterval: 5000,
  });

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    enabled: Boolean(user),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace(routeForRole(user.role));
    }
  }, [authLoading, hydrated, router, user]);

  const payload = dashboardQuery.data?.admin;

  if (!hydrated || authLoading || dashboardQuery.isLoading || !payload) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,#fff7dc_0%,#fff8ef_32%,#fdebd9_100%)] px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="rounded-[2.25rem] border-stone-200 bg-white/85 shadow-[0_24px_70px_rgba(120,53,15,0.12)]">
          <CardContent className="p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Ops console
            </div>
            <h1 className="mt-2 font-[family:var(--font-heading)] text-4xl font-semibold tracking-[-0.04em] text-stone-950">
              Watch live calls, approvals, and grounded answer traces.
            </h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {[
                { label: "Total calls", value: payload.total_calls },
                { label: "Support calls", value: payload.support_calls },
                { label: "Approval calls", value: payload.approval_calls },
                { label: "Pending approvals", value: payload.pending_approvals },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.75rem] bg-[#fff7e7] p-5"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {item.label}
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-stone-950">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.75rem] border border-stone-200 bg-[#fffaf3] p-4 text-sm text-stone-600">
              Health: {healthQuery.data?.status || "checking"} | Storage:{" "}
              {healthQuery.data?.services.storage || "unknown"} | LLM:{" "}
              {healthQuery.data?.services.llm || "unknown"}
            </div>
          </CardContent>
        </Card>

        <section>
          <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            Recent calls
          </div>
          <CallList calls={payload.recent_calls} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[2rem] border-stone-200 bg-white/82 p-6 shadow-[0_16px_45px_rgba(120,53,15,0.08)]">
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Approval outcomes
            </div>
            <div className="space-y-3">
              {payload.approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="rounded-[1.4rem] border border-stone-200 bg-white/85 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-stone-900">
                      {approval.id}
                    </div>
                    <div className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      {approval.status}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-stone-600">
                    {approval.resolution_note || "Awaiting final note"}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Tool + webhook traces
            </div>
            <TraceList traces={payload.traces} />
          </div>
        </section>
      </div>
    </div>
  );
}
