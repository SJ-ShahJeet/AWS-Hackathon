const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("penny_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const demoLogin = (email: string, role?: string) =>
  request<{ token: string; user: User }>("/api/auth/demo-login", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });

export const getAuthStatus = () =>
  request<AuthStatus>("/api/auth/status");

export const getMe = () =>
  request<{ user: User }>("/api/auth/me");

export const getProfile = () =>
  request<ProfileBundle>("/api/profile/me");

export const updatePhone = (phone_number: string) =>
  request<ProfileBundle>("/api/profile/phone", {
    method: "PATCH",
    body: JSON.stringify({ phone_number }),
  });

export const getDashboard = () =>
  request<DashboardResponse>("/api/dashboard");

export const getRecommendations = () =>
  request<RecommendationResponse>("/api/recommendations/current");

export const startSupportCall = (phone_number?: string) =>
  request<{ call: CallSession }>("/api/calls/support", {
    method: "POST",
    body: JSON.stringify({ phone_number }),
  });

export const startApprovalCall = (data: {
  approval_request_id?: string;
  phone_number?: string;
}) =>
  request<{ call: CallSession }>("/api/calls/approval", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const listCalls = () =>
  request<{ calls: CallSession[]; total: number }>("/api/calls");

export const getCall = (id: string) =>
  request<CallDetail>(`/api/calls/${id}`);

export const updateApproval = (
  approvalId: string,
  status: string,
  note = "",
  source = "manual"
) =>
  request<{ approval: ApprovalRequest }>(`/api/approvals/${approvalId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, note, source }),
  });

export const getTraces = () =>
  request<{ traces: TraceSpan[]; total: number }>("/api/traces");

export const getHealth = () =>
  request<{ status: string; version: string; services: Record<string, string> }>(
    "/api/health"
  );

export interface AuthStatus {
  mode: string;
  auth0_enabled: boolean;
  demo_login_enabled: boolean;
  checked_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "child" | "parent" | "admin";
  household_id?: string | null;
  ghost_user_id?: string | null;
  auth_subject?: string | null;
  phone_number?: string | null;
  avatar_name?: string | null;
  created_at: string;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  household_id: string;
  phone_number: string;
  balance_cents: number;
  threshold_cents: number;
  coin_balance: number;
  favorite_topics: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileBundle {
  user: User;
  profile: CustomerProfile | null;
}

export interface ChoreLedgerEntry {
  id: string;
  household_id: string;
  child_user_id: string;
  description: string;
  coins_earned: number;
  amount_cents: number;
  completed_at: string;
}

export interface RecommendationOption {
  id: string;
  recommendation_set_id: string;
  name: string;
  symbol: string;
  allocation_percent: number;
  risk_level: string;
  rationale: string;
  interest_match: string;
  sort_order: number;
}

export interface RecommendationSet {
  id: string;
  child_user_id: string;
  household_id: string;
  total_value_cents: number;
  threshold_reached: boolean;
  status: "ready" | "approval_pending" | "approved" | "declined";
  summary: string;
  approval_request_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  recommendation_set_id: string;
  child_user_id: string;
  parent_user_id: string;
  household_id: string;
  status: "pending" | "approved" | "declined";
  decision_source: string;
  resolution_note: string;
  requested_at: string;
  resolved_at?: string | null;
  created_at: string;
}

export interface RecommendationBundle {
  recommendation: RecommendationSet;
  options: RecommendationOption[];
  approval?: ApprovalRequest | null;
}

export interface RecommendationResponse {
  recommendations: RecommendationBundle[];
}

export interface CallSession {
  id: string;
  user_id: string;
  household_id: string;
  call_type: "support" | "approval";
  direction: "outbound" | "inbound";
  phone_number: string;
  status:
    | "queued"
    | "active"
    | "completed"
    | "failed"
    | "approved"
    | "declined"
    | "no_answer";
  recommendation_set_id?: string | null;
  approval_request_id?: string | null;
  vendor_call_id?: string | null;
  transcript: string;
  summary: string;
  last_question: string;
  answer_source: string;
  metadata: Record<string, unknown>;
  created_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  updated_at: string;
}

export interface CallEvent {
  id: string;
  call_session_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface TraceSpan {
  id: string;
  call_session_id?: string | null;
  operation: string;
  service: string;
  status: string;
  start_time: string;
  end_time?: string | null;
  duration_ms?: number | null;
  metadata: Record<string, unknown>;
  parent_span_id?: string | null;
}

export interface CallDetail {
  call: CallSession;
  events: CallEvent[];
  traces: TraceSpan[];
}

export interface ParentChildSnapshot {
  child: User;
  profile?: CustomerProfile | null;
  recommendation?: RecommendationBundle | null;
}

export interface DashboardChildPayload {
  user: User;
  profile?: CustomerProfile | null;
  chores: ChoreLedgerEntry[];
  recommendations: RecommendationBundle[];
  calls: CallSession[];
}

export interface DashboardParentPayload {
  user: User;
  household_children: ParentChildSnapshot[];
  approvals: ApprovalRequest[];
  calls: CallSession[];
}

export interface DashboardAdminPayload {
  total_calls: number;
  support_calls: number;
  approval_calls: number;
  pending_approvals: number;
  recent_calls: CallSession[];
  traces: TraceSpan[];
  approvals: ApprovalRequest[];
}

export interface DashboardResponse {
  role: "child" | "parent" | "admin";
  child?: DashboardChildPayload | null;
  parent?: DashboardParentPayload | null;
  admin?: DashboardAdminPayload | null;
}

export { API_BASE };
