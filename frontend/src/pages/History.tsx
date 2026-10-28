import { useState } from 'react'
import { useExpenses, useDeposits, useMembers, useVoidExpense } from '../api/hooks'
import { formatCents } from '../lib/format'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import type { Expense, Deposit } from '../api/types'

type HistoryEntry =
  | { kind: 'expense'; data: Expense }
  | { kind: 'deposit'; data: Deposit }

function ExpenseRow({
  expense,
  memberMap,
}: {
  expense: Expense
  memberMap: Map<string, string>
}) {
  const [expanded, setExpanded] = useState(false)
  const voidExpense = useVoidExpense()

  return (
    <div>
      <div
        className={`py-4 flex justify-between items-start cursor-pointer${expense.voided ? ' opacity-60' : ''}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium text-foreground${expense.voided ? ' line-through' : ''}`}
            >
              {expense.title}
            </span>
            {expense.voided && (
              <Badge variant="destructive">Voided</Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {new Date(expense.date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
          <span className="font-medium tabular-nums text-foreground">
            {formatCents(expense.totalCents)}
          </span>
          <Badge variant="secondary">
            {expense.items.length} {expense.items.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </div>

      {expanded && (
        <div className="mb-4 ml-4 flex flex-col gap-2">
          {expense.items.map((item) => {
            const participants = item.itemShares
              .map((s) => memberMap.get(s.memberId) ?? s.memberId)
              .join(', ')
            return (
              <div
                key={item.id}
                className="bg-muted/50 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm text-foreground">
                      {item.description}
                    </span>
                    {participants && (
                      <span className="text-xs text-muted-foreground">
                        {participants}
                      </span>
                    )}
                  </div>
                  <span className="tabular-nums text-sm text-foreground ml-4 shrink-0">
                    {formatCents(item.amountCents)}
                  </span>
                </div>
              </div>
            )
          })}
          {!expense.voided && (
            <div className="flex justify-end mt-1">
              <Button
                variant="destructive"
                size="sm"
                disabled={voidExpense.isPending}
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('Are you sure you want to void this expense?')) {
                    voidExpense.mutate(expense.id, {
                      onError: (err) => {
                        alert(err instanceof Error ? err.message : 'Failed to void expense.')
                      },
                    })
                  }
                }}
              >
                {voidExpense.isPending ? 'Voiding...' : 'Void Expense'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DepositRow({
  deposit,
  memberMap,
}: {
  deposit: Deposit
  memberMap: Map<string, string>
}) {
  const memberName = memberMap.get(deposit.memberId) ?? 'Unknown'

  return (
    <div
      className={`py-4 flex justify-between items-start${deposit.voided ? ' opacity-60' : ''}`}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Deposit</span>
          <span className="text-sm text-muted-foreground">{memberName}</span>
          {deposit.voided && (
            <Badge variant="destructive">Voided</Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {new Date(deposit.date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
      <div className="ml-4 shrink-0">
        <span className="font-medium tabular-nums text-[#2e7d32]">
          +{formatCents(deposit.amountCents)}
        </span>
      </div>
    </div>
  )
}

export default function History() {
  const expensesQuery = useExpenses()
  const depositsQuery = useDeposits()
  const membersQuery = useMembers()

  const isLoading =
    expensesQuery.isLoading || depositsQuery.isLoading || membersQuery.isLoading
  const isError =
    expensesQuery.isError || depositsQuery.isError || membersQuery.isError

  const memberMap = new Map<string, string>(
    (membersQuery.data ?? []).map((m) => [m.id, m.name])
  )

  const entries: HistoryEntry[] = [
    ...(expensesQuery.data ?? []).map(
      (e): HistoryEntry => ({ kind: 'expense', data: e })
    ),
    ...(depositsQuery.data ?? []).map(
      (d): HistoryEntry => ({ kind: 'deposit', data: d })
    ),
  ].sort(
    (a, b) =>
      new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  )

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <h1 className="text-2xl font-semibold mb-6">History</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && !isLoading && (
        <p className="text-destructive text-sm">
          Failed to load history. Please try again.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {entries.length === 0 && (
            <p className="text-muted-foreground">No transactions yet.</p>
          )}
          <div className="divide-y divide-border">
            {entries.map((entry) =>
              entry.kind === 'expense' ? (
                <ExpenseRow
                  key={`expense-${entry.data.id}`}
                  expense={entry.data}
                  memberMap={memberMap}
                />
              ) : (
                <DepositRow
                  key={`deposit-${entry.data.id}`}
                  deposit={entry.data}
                  memberMap={memberMap}
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}
