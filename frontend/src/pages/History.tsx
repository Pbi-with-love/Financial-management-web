import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useExpenses, useDeposits, useMembers, useVoidExpense, useReviseExpense, useExpense } from '../api/hooks'
import { formatCents } from '../lib/format'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import type { Expense, Deposit, Item } from '../api/types'

// Helper to format a Date as YYYY-MM-DD (local timezone)
function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toDateString(d)
}

function defaultTo(): string {
  return toDateString(new Date())
}

type HistoryEntry =
  | { kind: 'expense'; data: Expense }
  | { kind: 'deposit'; data: Deposit }

// Sub-component that fetches the previous version on demand
function PreviousVersion({ expenseId, memberMap }: { expenseId: string; memberMap: Map<string, string> }) {
  const { data, isLoading } = useExpense(expenseId)
  const prev = data?.replacedExpense

  if (isLoading) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 mt-2 text-sm text-muted-foreground">
        Loading previous version…
      </div>
    )
  }

  if (!prev) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 mt-2 text-sm text-muted-foreground">
        Previous version not available.
      </div>
    )
  }

  return (
    <div className="bg-muted/30 rounded-lg p-4 mt-2">
      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Previous version</p>
      <div className="flex flex-col gap-2">
        {prev.items.map((item) => {
          const participants = item.itemShares
            .map((s) => memberMap.get(s.memberId) ?? s.memberId)
            .join(', ')
          return (
            <div key={item.id} className="flex justify-between items-start">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-muted-foreground line-through">{item.description}</span>
                {participants && (
                  <span className="text-xs text-muted-foreground">{participants}</span>
                )}
              </div>
              <span className="tabular-nums text-sm text-muted-foreground line-through ml-4 shrink-0">
                {formatCents(item.amountCents)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-border flex justify-between">
        <span className="text-xs text-muted-foreground">Total (previous)</span>
        <span className="tabular-nums text-sm text-muted-foreground line-through">
          {formatCents(prev.totalCents)}
        </span>
      </div>
    </div>
  )
}

function ExpenseRow({
  expense,
  memberMap,
}: {
  expense: Expense
  memberMap: Map<string, string>
}) {
  const [expanded, setExpanded] = useState(false)
  const [showPrevious, setShowPrevious] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const voidExpense = useVoidExpense()
  const reviseMutation = useReviseExpense()

  const isEdited = !!expense.replacesExpenseId

  function startEdit() {
    const initial: Record<string, string> = {}
    for (const item of expense.items) {
      initial[item.id] = (item.amountCents / 100).toFixed(2)
    }
    setInputValues(initial)
    setEditError(null)
    setEditing(true)
    if (!expanded) setExpanded(true)
  }

  function cancelEdit() {
    setEditing(false)
    setEditError(null)
    setInputValues({})
  }

  async function handleSave() {
    setEditError(null)
    const items = expense.items.map((item: Item) => ({
      description: item.description,
      amountCents: Math.round(parseFloat(inputValues[item.id] ?? '0') * 100),
      category: item.category ?? undefined,
      participantIds: item.itemShares.map((s) => s.memberId),
    }))
    try {
      await reviseMutation.mutateAsync({ id: expense.id, items })
      setEditing(false)
      setInputValues({})
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('409') || msg.toLowerCase().includes('already')) {
        setEditError('This expense was already edited by someone else.')
      } else {
        setEditError(msg)
      }
    }
  }

  return (
    <div>
      <div
        className={`py-4 flex justify-between items-start cursor-pointer${expense.voided ? ' opacity-60' : ''}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-medium text-foreground${expense.voided ? ' line-through' : ''}`}
            >
              {expense.title}
            </span>
            {expense.voided && (
              <Badge variant="destructive">Voided</Badge>
            )}
            {isEdited && (
              <button
                className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPrevious((v) => !v)
                  if (!expanded) setExpanded(true)
                }}
                title="Show previous version"
              >
                Edited
              </button>
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
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inputValues[item.id] ?? ''}
                      onChange={(e) =>
                        setInputValues((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="h-9 w-24 text-right tabular-nums border border-border rounded-md px-2 text-sm bg-background"
                    />
                  ) : (
                    <span className="tabular-nums text-sm text-foreground ml-4 shrink-0">
                      {formatCents(item.amountCents)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {editError && (
            <p className="text-sm text-destructive mt-2">{editError}</p>
          )}

          {showPrevious && expense.replacesExpenseId && (
            <PreviousVersion
              expenseId={expense.id}
              memberMap={memberMap}
            />
          )}

          {!expense.voided && (
            <div className="flex justify-end gap-2 mt-1">
              {editing ? (
                <>
                  <Button
                    size="sm"
                    disabled={reviseMutation.isPending}
                    onClick={(e) => { e.stopPropagation(); void handleSave() }}
                  >
                    {reviseMutation.isPending ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); startEdit() }}
                  >
                    Edit
                  </Button>
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
                    {voidExpense.isPending ? 'Voiding…' : 'Void'}
                  </Button>
                </>
              )}
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
  const [searchParams, setSearchParams] = useSearchParams()

  const from = searchParams.get('from') ?? defaultFrom()
  const to = searchParams.get('to') ?? defaultTo()
  const memberId = searchParams.get('memberId') ?? ''
  const category = searchParams.get('category') ?? ''

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  const expenseFilters = {
    from,
    to,
    ...(memberId ? { memberId } : {}),
    ...(category ? { category } : {}),
  }

  const depositFilters = {
    from,
    to,
    ...(memberId ? { memberId } : {}),
  }

  const expensesQuery = useExpenses(expenseFilters)
  const depositsQuery = useDeposits(depositFilters)
  const membersQuery = useMembers()

  const isLoading =
    expensesQuery.isLoading || depositsQuery.isLoading || membersQuery.isLoading
  const isError =
    expensesQuery.isError || depositsQuery.isError || membersQuery.isError

  const memberMap = new Map<string, string>(
    (membersQuery.data ?? []).map((m) => [m.id, m.name])
  )

  // Derive distinct categories from loaded expenses
  const categories = Array.from(
    new Set(
      (expensesQuery.data ?? []).flatMap((e) =>
        e.items.map((i) => i.category).filter((c): c is string => !!c)
      )
    )
  ).sort()

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

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          value={from}
          onChange={(e) => setParam('from', e.target.value)}
          className="h-9 px-3 border border-border rounded-md text-sm bg-card text-foreground"
          aria-label="From date"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setParam('to', e.target.value)}
          className="h-9 px-3 border border-border rounded-md text-sm bg-card text-foreground"
          aria-label="To date"
        />
        <select
          value={memberId}
          onChange={(e) => setParam('memberId', e.target.value)}
          className="h-9 px-3 border border-border rounded-md text-sm bg-card text-foreground"
          aria-label="Member filter"
        >
          <option value="">All members</option>
          {(membersQuery.data ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setParam('category', e.target.value)}
          className="h-9 px-3 border border-border rounded-md text-sm bg-card text-foreground"
          aria-label="Category filter"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

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
            <p className="text-muted-foreground">No transactions found for the selected filters.</p>
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
