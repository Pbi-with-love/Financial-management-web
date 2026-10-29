import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMember, useDeposits, useExpenses, useVoidDeposit, useUpdateMember } from '../api/hooks'
import { formatCents } from '../lib/format'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import type { Deposit, ItemShare, Item, Expense } from '../api/types'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface EnrichedItemShare extends ItemShare {
  item: Item
  expense: Expense
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const updateMemberMutation = useUpdateMember()

  const {
    data: member,
    isLoading: memberLoading,
    isError: memberError,
    error: memberErrorObj,
  } = useMember(id ?? '')

  const { data: allDeposits, isLoading: depositsLoading } = useDeposits()
  const { data: allExpenses, isLoading: expensesLoading } = useExpenses()
  const voidDeposit = useVoidDeposit()

  const isLoading = memberLoading || depositsLoading || expensesLoading

  if (!id) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        <p className="text-muted-foreground text-center">Invalid member ID.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span>Loading member details…</span>
        </div>
      </div>
    )
  }

  if (memberError) {
    const msg = (memberErrorObj as Error)?.message ?? ''
    const is404 = msg.includes('404') || msg.toLowerCase().includes('not found')
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Link>
        </Button>
        <p className="text-center text-muted-foreground">
          {is404 ? 'Member not found.' : `Error: ${msg}`}
        </p>
      </div>
    )
  }

  if (!member) {
    return null
  }

  // Filter deposits for this member
  const memberDeposits: Deposit[] = (allDeposits ?? []).filter(
    (d) => d.memberId === id
  )

  // Extract item shares for this member from all expenses
  const memberItemShares: EnrichedItemShare[] = []
  for (const expense of allExpenses ?? []) {
    for (const item of expense.items) {
      for (const share of item.itemShares) {
        if (share.memberId === id) {
          memberItemShares.push({ ...share, item, expense })
        }
      }
    }
  }

  const balancePositive = member.balanceCents >= 0

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <Link to="/">
          <ArrowLeft className="size-4 mr-1" />
          Dashboard
        </Link>
      </Button>

      {/* Header card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {editingName ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const trimmed = nameInput.trim()
                  if (!trimmed) return
                  updateMemberMutation.mutate(
                    { id: id!, data: { name: trimmed } },
                    { onSuccess: () => setEditingName(false) }
                  )
                }}
              >
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="h-9 px-3 border border-border rounded-md text-sm bg-background text-foreground"
                  autoFocus
                />
                <Button size="sm" type="submit" disabled={updateMemberMutation.isPending}>
                  {updateMemberMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => setEditingName(false)}>
                  Cancel
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  {member.name}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                  onClick={() => { setNameInput(member.name); setEditingName(true) }}
                >
                  Edit
                </Button>
              </div>
            )}
            {!member.active && (
              <span className="mt-1 text-sm text-muted-foreground">(Inactive)</span>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">
              Balance
            </p>
            <p
              className={`text-3xl font-bold tabular-nums ${
                balancePositive ? 'text-[#2e7d32]' : 'text-destructive'
              }`}
            >
              {formatCents(member.balanceCents)}
            </p>
          </div>
        </div>

        {/* Deactivate / Reactivate */}
        <div className="mt-4 pt-4 border-t border-border flex justify-end">
          {member.active ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={updateMemberMutation.isPending}
              onClick={() => {
                if (window.confirm(`Deactivate ${member.name}? They will keep their balance and history but won't appear as a participant option.`)) {
                  updateMemberMutation.mutate(
                    { id: id!, data: { active: false } },
                    { onSuccess: () => navigate('/') }
                  )
                }
              }}
            >
              Deactivate member
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={updateMemberMutation.isPending}
              onClick={() => {
                updateMemberMutation.mutate({ id: id!, data: { active: true } })
              }}
            >
              Reactivate member
            </Button>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="deposits">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="deposits" className="flex-1">
            Deposits
            {memberDeposits.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({memberDeposits.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="shares" className="flex-1">
            Item Shares
            {memberItemShares.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({memberItemShares.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Deposits tab */}
        <TabsContent value="deposits">
          <Card>
            <CardContent className="px-0">
              {memberDeposits.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  No deposits yet.
                </p>
              ) : (
                <ul>
                  {memberDeposits.map((deposit) => (
                    <li
                      key={deposit.id}
                      className={`flex items-center justify-between gap-4 px-4 py-3 border-b border-border last:border-0 ${
                        deposit.voided ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground tabular-nums">
                            {formatCents(deposit.amountCents)}
                          </span>
                          {deposit.voided && (
                            <Badge variant="destructive">Voided</Badge>
                          )}
                        </div>
                        {deposit.note && (
                          <span className="text-xs text-muted-foreground truncate">
                            {deposit.note}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(deposit.date)}
                        </span>
                        {!deposit.voided && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={voidDeposit.isPending}
                            onClick={() => {
                              if (window.confirm('Are you sure you want to void this deposit?')) {
                                voidDeposit.mutate(deposit.id)
                              }
                            }}
                          >
                            {voidDeposit.isPending ? 'Voiding...' : 'Void'}
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Item shares tab */}
        <TabsContent value="shares">
          <Card>
            <CardContent className="px-0">
              {memberItemShares.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  No shares yet.
                </p>
              ) : (
                <ul>
                  {memberItemShares.map((share) => (
                    <li
                      key={share.id}
                      className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border last:border-0"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {share.item.description}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {share.expense.title}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-sm font-medium text-foreground tabular-nums">
                          {formatCents(share.amountCents)}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(share.expense.date)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
