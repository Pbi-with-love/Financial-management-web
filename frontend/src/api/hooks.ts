import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createDeposit,
  createExpense,
  getDeposits,
  getExpenses,
  getMember,
  getMembers,
  getRecentExpenses,
  voidDeposit,
  voidExpense,
} from './client';
import type { CreateDepositPayload, CreateExpensePayload } from './types';

export const queryKeys = {
  members: ['members'] as const,
  member: (id: string) => ['members', id] as const,
  expenses: ['expenses'] as const,
  recentExpenses: (limit?: number) => ['expenses', 'recent', limit] as const,
  deposits: ['deposits'] as const,
};

export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: getMembers,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: queryKeys.member(id),
    queryFn: () => getMember(id),
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses,
    queryFn: getExpenses,
  });
}

export function useRecentExpenses(limit?: number) {
  return useQuery({
    queryKey: queryKeys.recentExpenses(limit),
    queryFn: () => getRecentExpenses(limit),
  });
}

export function useDeposits() {
  return useQuery({
    queryKey: queryKeys.deposits,
    queryFn: getDeposits,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpense(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useVoidExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voidExpense(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepositPayload) => createDeposit(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deposits });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useVoidDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voidDeposit(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deposits });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}
