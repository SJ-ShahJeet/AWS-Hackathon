"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyIssueDetailRedirect() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) router.replace(`/calls/${id}`);
  }, [id, router]);

  return null;
}
