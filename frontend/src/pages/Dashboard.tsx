import { useNavigate } from 'react-router-dom'
import { useMembers, useRecentExpenses } from '@/api'
import { formatCents } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: members, isLoading, isError, refetch } = useMembers()
  const {
    data: recentExpenses,
    isLoading: isExpensesLoading,
    isError: isExpensesError,
    refetch: refetchExpenses,
  } = useRecentExpenses(10)

  const totalFund = members?.reduce((sum, m) => sum + (m.balanceCents ?? 0), 0) ?? 0

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

      {/* Recent expenses */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-medium text-foreground">Recent expenses</h2>
          {recentExpenses && recentExpenses.length > 0 && (
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </button>
          )}
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

        {recentExpenses && recentExpenses.length === 0 && (
          <div className="bg-card border border-border rounded-lg px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No expenses yet</p>
          </div>
        )}

        {recentExpenses && recentExpenses.length > 0 && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_120px_100px] gap-4 px-6 py-2.5 text-xs text-muted-foreground border-b border-border">
              <span>Expense</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Date</span>
            </div>

            {/* Table rows */}
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className={`grid grid-cols-1 md:grid-cols-[1fr_120px_100px] gap-1 md:gap-4 px-6 py-3.5 border-b border-border last:border-0 ${
                  expense.voided ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm truncate ${expense.voided ? 'line-through' : ''}`}>
                    {expense.title}
                  </span>
                  {expense.voided && (
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Voided</Badge>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
