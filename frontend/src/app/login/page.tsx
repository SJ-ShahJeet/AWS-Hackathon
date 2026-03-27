"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, PhoneCall, ShieldCheck, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoLogin, getAuthStatus } from "@/lib/api";
import { routeForRole } from "@/lib/utils";
import { useHybridAuth } from "@/components/layout/providers";
import { useAuth } from "@/store/auth";

const DEMO_ACCOUNTS = [
  {
    email: "maya@demo.com",
    role: "child",
    label: "Maya Hart",
    description: "Child dashboard with $63 balance and Penny picks",
    icon: User,
  },
  {
    email: "nina@demo.com",
    role: "parent",
    label: "Nina Hart",
    description: "Parent dashboard with pending approval",
    icon: ShieldCheck,
  },
  {
    email: "ops@demo.com",
    role: "admin",
    label: "Penny Ops",
    description: "Ops console for calls, approvals, and traces",
    icon: PhoneCall,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { auth0Enabled, auth0Loading, login } = useHybridAuth();
  const { user, hydrated, authLoading, setDemoAuth } = useAuth();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  const authStatus = useQuery({
    queryKey: ["auth-status"],
    queryFn: getAuthStatus,
  });

  useEffect(() => {
    if (hydrated && user) {
      router.replace(routeForRole(user.role));
    }
  }, [hydrated, router, user]);

  const demoMutation = useMutation({
    mutationFn: async (account: { email: string; role: string }) => {
      const result = await demoLogin(account.email, account.role);
      return result;
    },
    onSuccess: ({ user, token }) => {
      setDemoAuth(user, token);
      toast.success(`Signed in as ${user.name}`);
      router.push(routeForRole(user.role));
    },
    onError: (error: Error) => {
      toast.error(error.message || "Demo login failed");
    },
    onSettled: () => setLoadingEmail(null),
  });

  if (!hydrated || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,#fff7dc_0%,#fff8ef_35%,#fdebd9_100%)] px-6 py-12">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[2.25rem] border-stone-200 bg-white/82 p-2 shadow-[0_24px_70px_rgba(120,53,15,0.12)]">
          <CardContent className="p-8">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-[linear-gradient(135deg,#f7c95c,#ff9f6e)] text-stone-900 shadow-[0_14px_35px_rgba(245,158,11,0.18)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Hybrid Sign-in
            </div>
            <h1 className="mt-2 font-[family:var(--font-heading)] text-4xl font-semibold tracking-[-0.04em] text-stone-950">
              Pick a role and step into the live Penny care flow.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Demo accounts stay available for hackathon reliability. If your Auth0 SPA setup is ready, you can also use real tenant authentication from this same screen.
            </p>

            <div className="mt-6 rounded-[1.75rem] border border-stone-200 bg-[#fff9f1] p-5 text-sm leading-relaxed text-stone-600">
              <div className="font-semibold text-stone-900">What happens after login?</div>
              <ul className="mt-3 space-y-2">
                <li>Child view: balance, chores, Penny picks, call button</li>
                <li>Parent view: approval queue, manual fallback, approval-call button</li>
                <li>Ops view: recent Bland calls, outcomes, health, traces</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-[2.25rem] border-stone-200 bg-white/85 shadow-[0_20px_55px_rgba(120,53,15,0.1)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-stone-900">
                Demo accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  className="h-auto w-full justify-start rounded-[1.4rem] border-stone-200 bg-[#fffaf4] px-4 py-4 text-left"
                  disabled={demoMutation.isPending}
                  onClick={() => {
                    setLoadingEmail(account.email);
                    demoMutation.mutate(account);
                  }}
                >
                  {loadingEmail === account.email ? (
                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  ) : (
                    <account.icon className="mr-3 h-4 w-4 shrink-0 text-amber-700" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-stone-900">
                      {account.label}
                    </div>
                    <div className="text-xs text-stone-500">
                      {account.description}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2.25rem] border-stone-200 bg-white/85 shadow-[0_20px_55px_rgba(120,53,15,0.1)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-stone-900">
                Auth0 sign-in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-stone-600">
                Backend auth mode:{" "}
                <span className="font-semibold text-stone-900">
                  {authStatus.data?.mode || "checking"}
                </span>
              </p>
              <Button
                className="w-full rounded-full"
                disabled={!auth0Enabled || auth0Loading}
                onClick={() => void login()}
              >
                {auth0Loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Continue with Auth0
              </Button>
              <p className="text-xs leading-relaxed text-stone-500">
                This button becomes live when `NEXT_PUBLIC_AUTH0_DOMAIN` and `NEXT_PUBLIC_AUTH0_CLIENT_ID` are configured in the frontend env.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
