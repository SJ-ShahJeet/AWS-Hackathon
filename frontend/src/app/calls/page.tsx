"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { listCalls } from "@/lib/api";
import { CallList } from "@/components/penny/call-list";
import { useAuth } from "@/store/auth";

export default function CallsPage() {
  const router = useRouter();
  const { user, hydrated, authLoading } = useAuth();

  const callsQuery = useQuery({
    queryKey: ["calls"],
    queryFn: listCalls,
    enabled: Boolean(user),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (!user) router.replace("/login");
  }, [authLoading, hydrated, router, user]);

  if (!hydrated || authLoading || callsQuery.isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,#fff7dc_0%,#fff8ef_32%,#fdebd9_100%)] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Penny calls
          </div>
          <h1 className="mt-2 font-[family:var(--font-heading)] text-4xl font-semibold tracking-[-0.04em] text-stone-950">
            Support and approval call history
          </h1>
        </div>
        <CallList calls={callsQuery.data?.calls || []} />
      </div>
    </div>
  );
}
