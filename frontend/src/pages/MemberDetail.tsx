import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMember, useDeposits, useExpenses, useVoidDeposit, useUpdateMember, useDeleteMember, useUpdateItemShare, useDeleteItemShare } from '../api/hooks'
import { formatCents } from '../lib/format'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import type { Deposit, ItemShare, Item, Expense } from '../api/types'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface EnrichedItemShare extends ItemShare {
  item: Item
  expense: Expense
}

function ItemShareRow({
  share,
}: {
  share: EnrichedItemShare
}) {
  const [editing, setEditing] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const updateShare = useUpdateItemShare()
  const deleteShare = useDeleteItemShare()

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {share.item.description}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {share.expense.title} · {formatDate(share.expense.date)}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="h-8 w-20 text-right tabular-nums border border-border rounded-md px-2 text-sm bg-background"
              autoFocus
            />
            <Button
              size="sm"
              disabled={updateShare.isPending}
              onClick={() => {
                const cents = Math.round(parseFloat(amountInput) * 100)
                if (cents > 0) {
                  updateShare.mutate({ id: share.id, amountCents: cents }, {
                    onSuccess: () => setEditing(false),
                  })
                }
              }}
            >
              {updateShare.isPending ? '…' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-foreground tabular-nums">
              {formatCents(share.amountCents)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => { setAmountInput((share.amountCents / 100).toFixed(2)); setEditing(true) }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive"
              disabled={deleteShare.isPending}
              onClick={() => {
                if (window.confirm('Remove this share? This will change the member\'s balance.')) {
                  deleteShare.mutate(share.id)
                }
              }}
            >
              {deleteShare.isPending ? '…' : 'Remove'}
            </Button>
          </>
        )}
      </div>
    </li>
  )
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const updateMemberMutation = useUpdateMember()
  const deleteMemberMutation = useDeleteMember()

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

  if (!member) return null

  const memberDeposits: Deposit[] = (allDeposits ?? []).filter(
    (d) => d.memberId === id
  )

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
  const hasShares = memberItemShares.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
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

        {/* Delete member — disabled if has shares */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          {hasShares && (
            <p className="text-xs text-muted-foreground">Remove all shares before deleting</p>
          )}
          {!hasShares && <div />}
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMemberMutation.isPending || hasShares}
            onClick={() => {
              if (window.confirm(`Delete ${member.name}? This cannot be undone.`)) {
                deleteMemberMutation.mutate(id!, {
                  onSuccess: () => navigate('/'),
                  onError: (err) => {
                    alert(err instanceof Error ? err.message : 'Failed to delete member.')
                  },
                })
              }
            }}
          >
            {deleteMemberMutation.isPending ? 'Deleting…' : 'Delete member'}
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="deposits">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="deposits" className="flex-1">
            Deposits
            {memberDeposits.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({memberDeposits.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="shares" className="flex-1">
            Item Shares
            {memberItemShares.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({memberItemShares.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposits">
          <Card>
            <CardContent className="px-0">
              {memberDeposits.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">No deposits yet.</p>
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
                          {deposit.voided && <Badge variant="destructive">Voided</Badge>}
                        </div>
                        {deposit.note && (
                          <span className="text-xs text-muted-foreground truncate">{deposit.note}</span>
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
                              if (window.confirm('Void this deposit?')) {
                                voidDeposit.mutate(deposit.id)
                              }
                            }}
                          >
                            Void
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

        <TabsContent value="shares">
          <Card>
            <CardContent className="px-0">
              {memberItemShares.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">No shares yet.</p>
              ) : (
                <ul>
                  {memberItemShares.map((share) => (
                    <ItemShareRow key={share.id} share={share} />
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
