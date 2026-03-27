"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/store/auth";
import { routeForRole } from "@/lib/utils";

export default function IssuesRedirectPage() {
  const router = useRouter();
  const { user, hydrated, authLoading } = useAuth();

  useEffect(() => {
    if (!hydrated || authLoading) return;
    router.replace(user ? routeForRole(user.role) : "/login");
  }, [authLoading, hydrated, router, user]);

  return null;
}
