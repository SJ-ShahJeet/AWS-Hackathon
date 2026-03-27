// ─── Mock Data for Demo ───────────────────────────────────────────────────────
// Hardcoded — no real API calls needed for demo flow.

export type ChoreStatus = 'pending' | 'approved' | 'rejected';
export type InvestmentStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type RiskLevel = 'Low' | 'Moderate' | 'High';
export type NegotiationRecommendation = 'approve' | 'reject' | 'negotiate';

export interface Chore {
  id: string;
  childId: string;
  title: string;
  reward: number;
  status: ChoreStatus;
  description?: string;
  plannedDate?: string;
  proofImageUrl?: string;
  parentNote?: string;
  createdAt: string;
}

export interface NegotiationResult {
  confidenceScore: number;
  childArgument: string;
  diversificationWarning: string;
  recommendation: NegotiationRecommendation;
}

export interface Investment {
  id: string;
  childId: string;
  ticker: string;
  companyName: string;
  amount: number;
  shares: number;
  status: InvestmentStatus;
  risk: RiskLevel;
  projectedReturn: string;
  parentReason?: string;
  negotiationData?: NegotiationResult;
  createdAt: string;
}

export interface PortfolioHolding {
  ticker: string;
  companyName: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  currentValue: number;
  gainLossPct: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  balance: number;
  threshold: number;
  portfolio: PortfolioHolding[];
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

export const SOPHIE: ChildProfile = {
  id: 'sophie-001',
  name: 'Sophie',
  balance: 47.50,
  threshold: 50,
  portfolio: [],
};

export const SOPHIE_CHORES: Chore[] = [
  {
    id: 'chore-1',
    childId: 'sophie-001',
    title: 'Wash Dishes',
    reward: 2,
    status: 'pending',
    description: 'Washed all dishes after dinner',
    createdAt: '2026-03-25T18:00:00Z',
  },
  {
    id: 'chore-2',
    childId: 'sophie-001',
    title: 'Walk the Dog',
    reward: 3,
    status: 'pending',
    description: 'Walked Max around the block twice',
    createdAt: '2026-03-26T08:00:00Z',
  },
];

export const SOPHIE_INVESTMENT: Investment = {
  id: 'invest-1',
  childId: 'sophie-001',
  ticker: 'NKE',
  companyName: 'Nike',
  amount: 50,
  shares: 0.58,
  status: 'pending',
  risk: 'Moderate',
  projectedReturn: '8%',
  createdAt: '2026-03-26T10:00:00Z',
};

export const MOCK_NEGOTIATION: NegotiationResult = {
  confidenceScore: 72,
  childArgument: "Nike is a brand I use every day. I think companies I understand are safer to invest in.",
  diversificationWarning: 'Portfolio is 100% in a single consumer discretionary stock. Consider adding a low-cost index fund.',
  recommendation: 'negotiate',
};

export const WEEKLY_REPORT = {
  title: 'Weekly Report — Week of Mar 24',
  summary: 'Sophie earned $5 this week from chores. She saved 100% of her earnings and is now just $2.50 away from her first investment.',
  highlights: [
    'Completed 2 chores',
    'Saved $5.00',
    'No spending this week',
    '$47.50 total balance',
  ],
};
