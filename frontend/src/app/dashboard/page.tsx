"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PhoneCall, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDashboard, startApprovalCall, startSupportCall, updatePhone } from "@/lib/api";
import { CallList } from "@/components/penny/call-list";
import { LedgerList } from "@/components/penny/ledger-list";
import { RecommendationStack } from "@/components/penny/recommendation-stack";
import { useAuth } from "@/store/auth";
import { routeForRole } from "@/lib/utils";

function money(cents = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hydrated, authLoading } = useAuth();
  const [phone, setPhone] = useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    enabled: Boolean(user),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "child") {
      router.replace(routeForRole(user.role));
    }
  }, [authLoading, hydrated, router, user]);

  const payload = dashboardQuery.data?.child;
  const bundle = payload?.recommendations?.[0] || null;

  const progress = useMemo(() => {
    const balance = payload?.profile?.balance_cents || 0;
    const threshold = payload?.profile?.threshold_cents || 5000;
    return Math.min(100, Math.round((balance / threshold) * 100));
  }, [payload?.profile?.balance_cents, payload?.profile?.threshold_cents]);

  const currentPhone =
    phone ??
    payload?.profile?.phone_number ??
    payload?.user.phone_number ??
    "";

  const phoneMutation = useMutation({
    mutationFn: () => updatePhone(currentPhone),
    onSuccess: () => {
      toast.success("Phone number updated");
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not update phone number"),
  });

  const supportMutation = useMutation({
    mutationFn: () => startSupportCall(currentPhone),
    onSuccess: ({ call }) => {
      toast.success("Penny queued your customer-care call");
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/calls/${call.id}`);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to start support call"),
  });

  const approvalMutation = useMutation({
    mutationFn: () =>
      startApprovalCall({
        approval_request_id: bundle?.approval?.id,
      }),
    onSuccess: () => {
      toast.success("Parent approval call queued");
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to queue parent approval call"),
  });

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
        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[2.25rem] border-stone-200 bg-white/85 shadow-[0_24px_70px_rgba(120,53,15,0.12)]">
            <CardContent className="p-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-[#fff6df] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                <Sparkles className="h-4 w-4" />
                Child Dashboard
              </div>
              <h1 className="font-[family:var(--font-heading)] text-4xl font-semibold tracking-[-0.04em] text-stone-950">
                Hi {payload.user.name.split(" ")[0]}, your Penny balance is climbing.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
                Once you cross the $50 learning threshold, Penny can explain why each starter investment option was picked and then call your parent for approval.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.75rem] bg-[#fff7e7] p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Balance
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-stone-950">
                    {money(payload.profile?.balance_cents)}
                  </div>
                </div>
                <div className="rounded-[1.75rem] bg-[#fff7e7] p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Coins
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-stone-950">
                    {payload.profile?.coin_balance ?? 0}
                  </div>
                </div>
                <div className="rounded-[1.75rem] bg-[#fff7e7] p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Threshold
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-stone-950">
                    {progress}%
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-3 rounded-full bg-[linear-gradient(90deg,#f6c657,#fb923c)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.25rem] border-stone-200 bg-white/85 shadow-[0_24px_70px_rgba(120,53,15,0.12)]">
            <CardContent className="p-7">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Call Penny
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                Start the customer-care call from this dashboard
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Penny can call the saved number below, answer grounded questions on the live call, and trigger the parent approval flow when you are ready.
              </p>

              <div className="mt-5 space-y-3">
                <Input
                  value={currentPhone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-12 rounded-full border-stone-300 bg-[#fffaf3] px-5"
                  placeholder="+1 415 555 0127"
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => phoneMutation.mutate()}
                    variant="outline"
                    className="rounded-full border-stone-300 bg-white/80"
                    disabled={phoneMutation.isPending}
                  >
                    {phoneMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Number
                  </Button>
                  <Button
                    onClick={() => supportMutation.mutate()}
                    className="rounded-full"
                    disabled={supportMutation.isPending}
                  >
                    {supportMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PhoneCall className="mr-2 h-4 w-4" />
                    )}
                    Call Customer Care
                  </Button>
                </div>
                {bundle?.approval?.status === "pending" ? (
                  <Button
                    onClick={() => approvalMutation.mutate()}
                    variant="secondary"
                    className="rounded-full"
                    disabled={approvalMutation.isPending}
                  >
                    {approvalMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PhoneCall className="mr-2 h-4 w-4" />
                    )}
                    Queue Parent Approval Call
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>

        {bundle ? <RecommendationStack bundle={bundle} /> : null}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[2rem] border-stone-200 bg-white/82 p-6 shadow-[0_16px_45px_rgba(120,53,15,0.08)]">
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Recent chores
            </div>
            <LedgerList chores={payload.chores} />
          </Card>

          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Call history
            </div>
            <CallList calls={payload.calls} />
          </div>
        </section>
      </div>
    </div>
  );
}
