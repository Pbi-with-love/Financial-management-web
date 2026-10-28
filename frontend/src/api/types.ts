export interface Member {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface MemberWithBalance extends Member {
  balanceCents: number;
}

export interface ItemShare {
  id: string;
  itemId: string;
  memberId: string;
  amountCents: number;
}

export interface Item {
  id: string;
  expenseId: string;
  description: string;
  amountCents: number;
  category: string | null;
  itemShares: ItemShare[];
}

export interface Expense {
  id: string;
  title: string;
  date: string;
  note: string | null;
  totalCents: number;
  voided: boolean;
  voidedAt: string | null;
  createdAt: string;
  items: Item[];
  replacesExpenseId?: string | null;
  replacedByExpenseId?: string | null;
  replacedExpense?: Expense | null;
}

export interface Deposit {
  id: string;
  memberId: string;
  amountCents: number;
  note: string | null;
  date: string;
  voided: boolean;
  voidedAt: string | null;
  createdAt: string;
}

export interface CreateExpensePayload {
  title: string;
  date: string;
  note?: string;
  items: {
    description: string;
    amountCents: number;
    category?: string;
    participantIds: string[];
  }[];
}

export interface CreateDepositPayload {
  memberId: string;
  amountCents: number;
  date: string;
  note?: string;
}
