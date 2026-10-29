import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createDeposit,
  createExpense,
  createMember,
  getDeposits,
  getExpense,
  getExpenses,
  getMember,
  getMembers,
  getRecentExpenses,
  reviseExpense,
  deleteMember,
  updateMember,
  voidDeposit,
  voidExpense,
} from './client';
import type { DepositFilters, ExpenseFilters } from './client';
import type { CreateDepositPayload, CreateExpensePayload } from './types';

export const queryKeys = {
  members: ['members'] as const,
  member: (id: string) => ['members', id] as const,
  expenses: (filters?: ExpenseFilters) => ['expenses', filters] as const,
  expense: (id: string) => ['expenses', id] as const,
  recentExpenses: (limit?: number) => ['expenses', 'recent', limit] as const,
  deposits: (filters?: DepositFilters) => ['deposits', filters] as const,
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

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: queryKeys.expenses(filters),
    queryFn: () => getExpenses(filters),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: queryKeys.expense(id),
    queryFn: () => getExpense(id),
    enabled: !!id,
  });
}

export function useRecentExpenses(limit?: number) {
  return useQuery({
    queryKey: queryKeys.recentExpenses(limit),
    queryFn: () => getRecentExpenses(limit),
  });
}

export function useDeposits(filters?: DepositFilters) {
  return useQuery({
    queryKey: queryKeys.deposits(filters),
    queryFn: () => getDeposits(filters),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpense(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useVoidExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voidExpense(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepositPayload) => createDeposit(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deposits'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useVoidDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voidDeposit(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deposits'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; active?: boolean } }) =>
      updateMember(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
      void queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createMember(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useReviseExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: Parameters<typeof reviseExpense>[1] }) =>
      reviseExpense(id, items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}
