// ─── Backend API Client ───────────────────────────────────────────────────────
// All fetch() calls to FastAPI go through here.
// Vite proxies /api → http://localhost:8000

import type { Chore } from './mockData';

const BASE = '/api';

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
  console.log('[API] auth token', token ? 'set' : 'cleared');
}

function authHeaders(): Record<string, string> {
  return _authToken ? { Authorization: `Bearer ${_authToken}` } : {};
}

async function post<T>(path: string, body: unknown): Promise<T> {
  console.log(`[API] POST ${path}`, body);
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  console.log(`[API] POST ${path} response`, json);
  return json as T;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function get<T>(path: string): Promise<T> {
  console.log(`[API] GET ${path}`);
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const json = await res.json();
  console.log(`[API] GET ${path} response`, json);
  return json as T;
}

export const api = {
  chores: {
    list: (childId: string) =>
      get<ApiResponse<Chore[]>>(`/chores/list/${childId}`),
    create: (chore: Partial<Chore> & { title: string }) =>
      post<ApiResponse<Chore>>('/chores/create', chore),
    approve: (choreId: string, reward: number) =>
      post<ApiResponse<{ choreId: string; newBalance: number }>>('/chores/approve', { choreId, reward }),
    reject: (choreId: string) =>
      post<ApiResponse<{ choreId: string }>>('/chores/reject', { choreId }),
    submitProof: (choreId: string, proofBase64: string) =>
      post<ApiResponse<{ proofUrl: string }>>('/chores/submit-proof', { choreId, proofBase64 }),
    balance: (childId: string) =>
      get<ApiResponse<{ balance: number }>>(`/chores/balance/${childId}`),
  },
  investments: {
    request: (inv: Record<string, unknown>) =>
      post<ApiResponse<{ investmentId: string }>>('/investments/request', inv),
    approve: (investmentId: string) =>
      post<ApiResponse<{ investmentId: string; newBalance: number }>>('/investments/approve', { investmentId }),
    reject: (investmentId: string, reason: string) =>
      post<ApiResponse<{ investmentId: string; negotiationData: unknown }>>('/investments/reject', {
        investmentId,
        reason,
      }),
    portfolio: (childId: string) =>
      get<ApiResponse<unknown[]>>(`/investments/portfolio/${childId}`),
  },
};
