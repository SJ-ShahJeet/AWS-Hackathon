"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PhoneCall } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboard, startApprovalCall, updateApproval } from "@/lib/api";
import { CallList } from "@/components/penny/call-list";
import { RecommendationStack } from "@/components/penny/recommendation-stack";
import { useAuth } from "@/store/auth";
import { routeForRole } from "@/lib/utils";

export default function ParentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hydrated, authLoading } = useAuth();

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
    if (user.role !== "parent") {
      router.replace(routeForRole(user.role));
    }
  }, [authLoading, hydrated, router, user]);

  const payload = dashboardQuery.data?.parent;

  const callMutation = useMutation({
    mutationFn: (approval_request_id: string) => startApprovalCall({ approval_request_id }),
    onSuccess: () => {
      toast.success("Parent approval call queued");
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not queue approval call"),
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      approvalId,
      status,
    }: {
      approvalId: string;
      status: "approved" | "declined";
    }) => updateApproval(approvalId, status, `Parent ${status} from dashboard`, "parent_dashboard"),
    onSuccess: () => {
      toast.success("Approval decision saved");
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not update approval"),
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
        <Card className="rounded-[2.25rem] border-stone-200 bg-white/85 shadow-[0_24px_70px_rgba(120,53,15,0.12)]">
          <CardContent className="p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Parent controls
            </div>
            <h1 className="mt-2 font-[family:var(--font-heading)] text-4xl font-semibold tracking-[-0.04em] text-stone-950">
              Review the Penny suggestion before anything moves forward.
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-stone-600">
              You can let Bland place the approval call, or use the manual fallback right here. Either way, the child does not move into an approved plan until you say yes.
            </p>
          </CardContent>
        </Card>

        <section className="space-y-5">
          {payload.household_children.map((item) => (
            <div key={item.child.id} className="space-y-4">
              <Card className="rounded-[2rem] border-stone-200 bg-white/82 p-6 shadow-[0_16px_45px_rgba(120,53,15,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Child snapshot
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                      {item.child.name}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                      {item.profile?.notes || "No extra parent notes yet."}
                    </p>
                  </div>
                  {item.recommendation?.approval?.status === "pending" ? (
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          void callMutation.mutate(item.recommendation!.approval!.id)
                        }
                        className="rounded-full"
                        disabled={callMutation.isPending}
                      >
                        {callMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <PhoneCall className="mr-2 h-4 w-4" />
                        )}
                        Queue Approval Call
                      </Button>
                      <Button
                        onClick={() =>
                          void decisionMutation.mutate({
                            approvalId: item.recommendation!.approval!.id,
                            status: "approved",
                          })
                        }
                        variant="secondary"
                        className="rounded-full"
                        disabled={decisionMutation.isPending}
                      >
                        Approve Now
                      </Button>
                      <Button
                        onClick={() =>
                          void decisionMutation.mutate({
                            approvalId: item.recommendation!.approval!.id,
                            status: "declined",
                          })
                        }
                        variant="outline"
                        className="rounded-full border-stone-300 bg-white/80"
                        disabled={decisionMutation.isPending}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>

              {item.recommendation ? (
                <RecommendationStack
                  bundle={item.recommendation}
                  title={`${item.child.name.split(" ")[0]} current Penny mix`}
                />
              ) : null}
            </div>
          ))}
        </section>

        <section>
          <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            Household call history
          </div>
          <CallList calls={payload.calls} />
        </section>
      </div>
    </div>
  );
}
