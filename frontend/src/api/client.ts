import type {
  CreateDepositPayload,
  CreateExpensePayload,
  Deposit,
  Expense,
  MemberWithBalance,
} from './types';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

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

export function getExpenses(): Promise<Expense[]> {
  return request<Expense[]>('/expenses');
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

export function getDeposits(): Promise<Deposit[]> {
  return request<Deposit[]>('/deposits');
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
