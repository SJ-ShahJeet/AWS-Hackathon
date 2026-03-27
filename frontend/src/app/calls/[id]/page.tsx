"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getCall } from "@/lib/api";
import { CallStatusChip } from "@/components/penny/call-status-chip";
import { TraceList } from "@/components/penny/trace-list";
import { useAuth } from "@/store/auth";

export default function CallDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, hydrated, authLoading } = useAuth();

  const callQuery = useQuery({
    queryKey: ["call", id],
    queryFn: () => getCall(id),
    enabled: Boolean(user && id),
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (!user) router.replace("/login");
  }, [authLoading, hydrated, router, user]);

  if (!hydrated || authLoading || callQuery.isLoading || !callQuery.data) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  const { call, events, traces } = callQuery.data;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,#fff7dc_0%,#fff8ef_32%,#fdebd9_100%)] px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="rounded-[2.25rem] border-stone-200 bg-white/85 shadow-[0_24px_70px_rgba(120,53,15,0.12)]">
          <CardContent className="p-7">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Call detail
              </div>
              <CallStatusChip status={call.status} />
            </div>
            <h1 className="font-[family:var(--font-heading)] text-4xl font-semibold tracking-[-0.04em] text-stone-950">
              {call.call_type === "support" ? "Customer Care Call" : "Parent Approval Call"}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-600">
              <span>{call.phone_number}</span>
              <span>{new Date(call.created_at).toLocaleString()}</span>
              {call.vendor_call_id ? <span>Vendor ID: {call.vendor_call_id}</span> : null}
            </div>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-stone-600">
              {call.summary || "Waiting for more call details."}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="rounded-[2rem] border-stone-200 bg-white/82 p-6 shadow-[0_16px_45px_rgba(120,53,15,0.08)]">
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Transcript
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">
              {call.transcript || "Transcript has not been attached yet."}
            </p>
          </Card>

          <Card className="rounded-[2rem] border-stone-200 bg-white/82 p-6 shadow-[0_16px_45px_rgba(120,53,15,0.08)]">
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Call events
            </div>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-[1.3rem] border border-stone-200 bg-white/85 px-4 py-3"
                >
                  <div className="text-sm font-medium text-stone-900">
                    {event.event_type}
                  </div>
                  <div className="mt-1 text-xs text-stone-500">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-[1rem] bg-[#fffaf3] p-3 text-xs text-stone-600">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <section>
          <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            Trace timeline
          </div>
          <TraceList traces={traces} />
        </section>
      </div>
    </div>
  );
}
