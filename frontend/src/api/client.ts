import type {
  CreateDepositPayload,
  CreateExpensePayload,
  Deposit,
  Expense,
  MemberWithBalance,
} from './types';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export interface ExpenseFilters {
  limit?: number;
  from?: string;
  to?: string;
  category?: string;
  memberId?: string;
  includeVoided?: boolean;
}

export interface DepositFilters {
  from?: string;
  to?: string;
  memberId?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `API error: ${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // ignore JSON parse errors; use default message
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getMembers(): Promise<MemberWithBalance[]> {
  return request<MemberWithBalance[]>('/members');
}

export function getMember(id: string): Promise<MemberWithBalance> {
  return request<MemberWithBalance>(`/members/${id}`);
}

export function getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
  const params = new URLSearchParams();
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.memberId) params.set('memberId', filters.memberId);
  if (filters?.includeVoided !== undefined) params.set('includeVoided', String(filters.includeVoided));
  const qs = params.toString();
  return request<Expense[]>('/expenses' + (qs ? '?' + qs : ''));
}

export function getExpense(id: string): Promise<Expense> {
  return request<Expense>(`/expenses/${id}`);
}

export function getRecentExpenses(limit = 5): Promise<Expense[]> {
  return request<Expense[]>(`/expenses?limit=${limit}`);
}

export function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  return request<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function voidExpense(id: string): Promise<Expense> {
  return request<Expense>(`/expenses/${id}/void`, {
    method: 'POST',
  });
}

export function getDeposits(filters?: DepositFilters): Promise<Deposit[]> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.memberId) params.set('memberId', filters.memberId);
  const qs = params.toString();
  return request<Deposit[]>('/deposits' + (qs ? '?' + qs : ''));
}

export function createDeposit(payload: CreateDepositPayload): Promise<Deposit> {
  return request<Deposit>('/deposits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function voidDeposit(id: string): Promise<Deposit> {
  return request<Deposit>(`/deposits/${id}/void`, {
    method: 'POST',
  });
}

export async function reviseExpense(id: string, items: CreateExpensePayload['items']): Promise<Expense> {
  return request('/expenses/' + id + '/revise', { method: 'PUT', body: JSON.stringify({ items }) });
}
