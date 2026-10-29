import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers, useRecentExpenses, useReviseExpense } from '@/api'
import type { Expense, Item } from '@/api'
import { formatCents } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

// Per-expense expandable row with inline edit support
function ExpenseRow({
  expense,
  memberMap,
}: {
  expense: Expense
  memberMap: Map<string, string>
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  // Map itemId → euro string input value
  const [inputValues, setInputValues] = useState<Record<string, string>>({})

  const reviseMutation = useReviseExpense()

  function startEdit() {
    const initial: Record<string, string> = {}
    for (const item of expense.items) {
      const euros = (item.amountCents / 100).toFixed(2)
      initial[item.id] = euros
    }
    setInputValues(initial)
    setEditError(null)
    setEditing(true)
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
    <div className={`border-b border-border last:border-0 ${expense.voided ? 'opacity-50' : ''}`}>
      {/* Summary row — clickable to expand */}
      <button
        onClick={() => { setExpanded((v) => !v); setEditing(false); setEditError(null) }}
        className="w-full grid grid-cols-1 md:grid-cols-[1fr_120px_100px] gap-1 md:gap-4 px-6 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-sm truncate ${expense.voided ? 'line-through' : ''}`}>
            {expense.title}
          </span>
          {expense.voided && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Voided</Badge>
          )}
          {expense.replacedByExpenseId && !expense.voided && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">Revised</Badge>
          )}
        </div>
        <span className="text-sm tabular-nums text-right font-medium">
          {formatCents(expense.totalCents)}
        </span>
        <span className="text-sm tabular-nums text-right text-muted-foreground">
          {new Date(expense.date).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short',
          })}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-6 pb-4">
          <div className="bg-muted/50 rounded-lg p-4 mt-2">
            {expense.items.map((item: Item) => (
              <div key={item.id} className="mb-3 last:mb-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.description}</span>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inputValues[item.id] ?? ''}
                      onChange={(e) =>
                        setInputValues((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="h-9 w-24 text-right tabular-nums border border-border rounded-md px-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <span className="text-sm tabular-nums font-medium">
                      {formatCents(item.amountCents)}
                    </span>
                  )}
                </div>
                {/* Per-person shares */}
                <div className="mt-1 space-y-0.5">
                  {item.itemShares.map((share) => (
                    <div key={share.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{memberMap.get(share.memberId) ?? share.memberId}</span>
                      <span className="tabular-nums">{formatCents(share.amountCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Error message */}
            {editError && (
              <p className="text-sm text-destructive mt-3">{editError}</p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4">
              {editing ? (
                <>
                  <button
                    onClick={() => { void handleSave() }}
                    disabled={reviseMutation.isPending}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {reviseMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                !expense.voided && !expense.replacedByExpenseId && (
                  <button
                    onClick={startEdit}
                    className="h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
                  >
                    Edit
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: members, isLoading, isError, refetch } = useMembers()
  const {
    data: recentExpenses,
    isLoading: isExpensesLoading,
    isError: isExpensesError,
    refetch: refetchExpenses,
  } = useRecentExpenses(20)

  const totalFund = members?.reduce((sum, m) => sum + (m.balanceCents ?? 0), 0) ?? 0

  // Build memberId → name map
  const memberMap = new Map<string, string>(
    (members ?? []).map((m) => [m.id, m.name])
  )

  // Filter to today's expenses (browser local date)
  const today = new Date().toISOString().slice(0, 10)
  const todayExpenses = recentExpenses?.filter((e) => e.date.slice(0, 10) === today) ?? []

  return (
    <div className="px-6 md:px-8 py-8 max-w-[1200px]">
      {/* Page title */}
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground">
          Overview
        </h1>
      </div>

      {isLoading && (
        <p className="text-muted-foreground py-12">Loading balances…</p>
      )}

      {isError && (
        <div className="py-12">
          <p className="text-destructive text-sm mb-3">Failed to load member balances.</p>
          <button
            onClick={() => refetch()}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {members && (
        <>
          {/* KPI strip — balances in a single row, separated by 1px dividers */}
          <div className="bg-card border border-border rounded-lg">
            <div className="flex divide-x divide-border">
              {/* Fund total */}
              <div className="flex-1 px-6 py-5 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Fund balance</p>
                <p className={`text-[28px] font-bold tracking-[-0.02em] tabular-nums ${totalFund >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                  {formatCents(totalFund)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Per-member balances */}
              {members.map((member) => {
                const bal = member.balanceCents ?? 0
                return (
                  <button
                    key={member.id}
                    onClick={() => navigate(`/members/${member.id}`)}
                    className="flex-1 px-6 py-5 min-w-0 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      {member.name}
                    </p>
                    <p className={`text-xl font-bold tracking-[-0.02em] tabular-nums ${
                      bal > 0 ? 'text-[#2e7d32]' : bal < 0 ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {formatCents(bal)}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Today's expenses */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-medium text-foreground">Today's expenses</h2>
        </div>

        {isExpensesLoading && (
          <p className="text-muted-foreground text-sm py-6">Loading…</p>
        )}

        {isExpensesError && (
          <div className="py-6">
            <p className="text-destructive text-sm mb-3">Failed to load recent expenses.</p>
            <button
              onClick={() => refetchExpenses()}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {recentExpenses && todayExpenses.length === 0 && (
          <div className="bg-card border border-border rounded-lg px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No expenses today</p>
          </div>
        )}

        {recentExpenses && todayExpenses.length > 0 && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_120px_100px] gap-4 px-6 py-2.5 text-xs text-muted-foreground border-b border-border">
              <span>Expense</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Date</span>
            </div>

            {/* Expandable rows */}
            {todayExpenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} memberMap={memberMap} />
            ))}
          </div>
        )}

        {/* View all link */}
        {recentExpenses && (
          <div className="mt-3 text-right">
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
