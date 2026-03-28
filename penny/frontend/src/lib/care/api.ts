// ─── Customer-Care API Client ────────────────────────────────────────────────
// All customer-care fetch() calls go through here.

const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('penny_token');
}

async function careGet<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  return res.json();
}

async function carePost<T>(path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function carePatch<T>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CareUser {
  id: string;
  email: string;
  name: string;
  role: 'child' | 'parent' | 'admin';
  household_id: string;
  phone_number?: string;
}

export interface CustomerProfile {
  balance_cents: number;
  threshold_cents: number;
  coin_balance: number;
  favorite_topics: string[];
  notes?: string;
}

export interface CallSession {
  id: string;
  call_type: 'support' | 'approval';
  status: string;
  phone_number: string;
  transcript?: string;
  summary?: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface RecommendationOption {
  id: string;
  name: string;
  symbol: string;
  allocation_percent: number;
  risk_level: string;
  rationale: string;
  interest_match: string;
}

export interface RecommendationBundle {
  recommendation: {
    id: string;
    total_value_cents: number;
    status: string;
    summary: string;
  };
  options: RecommendationOption[];
  approval?: ApprovalRequest;
}

export interface ApprovalRequest {
  id: string;
  status: 'pending' | 'approved' | 'declined';
  resolution_note?: string;
  requested_at: string;
  resolved_at?: string;
  child_user_id: string;
  parent_user_id?: string;
}

export interface ChoreLedgerEntry {
  description: string;
  coins_earned: number;
  amount_cents: number;
  completed_at: string;
}

export interface TraceSpan {
  id: string;
  operation: string;
  service: string;
  status: string;
  start_time: string;
  duration_ms: number;
  metadata?: Record<string, unknown>;
}

export interface CallEvent {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface DashboardData {
  user: CareUser;
  profile?: CustomerProfile;
  chores?: ChoreLedgerEntry[];
  recommendations?: RecommendationBundle[];
  calls?: CallSession[];
  children?: Array<{
    user: CareUser;
    profile?: CustomerProfile;
    recommendations?: RecommendationBundle[];
  }>;
  approvals?: ApprovalRequest[];
  total_calls?: number;
  support_calls?: number;
  approval_calls?: number;
  pending_approvals?: number;
  recent_calls?: CallSession[];
  traces?: TraceSpan[];
}

// ─── API functions ───────────────────────────────────────────────────────────

export const careApi = {
  // Auth
  demoLogin: (email: string, role: string) =>
    carePost<{ user: CareUser; token: string }>('/auth/demo-login', { email, role }),
  getMe: () => careGet<CareUser>('/auth/me'),
  getAuthStatus: () => careGet<{ mode: string; demo_enabled: boolean }>('/auth/status'),

  // Dashboard
  getDashboard: () => careGet<DashboardData>('/dashboard'),
  getRecommendations: () => careGet<RecommendationBundle[]>('/recommendations/current'),

  // Profile
  getProfile: () => careGet<{ user: CareUser; profile: CustomerProfile }>('/profile/me'),
  updatePhone: (phone: string) => carePatch<CareUser>('/profile/phone', { phone_number: phone }),

  // Calls
  startSupportCall: (phone: string) => carePost<CallSession>('/calls/support', { phone_number: phone }),
  startApprovalCall: (approvalId: string, phone: string) =>
    carePost<CallSession>('/calls/approval', { approval_request_id: approvalId, phone_number: phone }),
  listCalls: () => careGet<{ calls: CallSession[] }>('/calls'),
  getCall: (id: string) => careGet<{ call: CallSession; events: CallEvent[]; traces: TraceSpan[] }>(`/calls/${id}`),

  // Approvals
  updateApproval: (id: string, status: string, note?: string) =>
    carePatch<ApprovalRequest>(`/approvals/${id}`, { status, resolution_note: note, decision_source: 'dashboard' }),

  // Observability
  getTraces: () => careGet<TraceSpan[]>('/traces'),
  getHealth: () => careGet<{ status: string; version: string; services: Record<string, unknown> }>('/health'),
};
