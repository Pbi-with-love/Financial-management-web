import { useState } from 'react'
import { useDeposits, useCreateDeposit, useMembers } from '@/api/hooks'
import { formatCents } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function Deposits() {
  const { data: deposits, isLoading: depositsLoading, isError: depositsError } = useDeposits()
  const { data: members } = useMembers()
  const createDeposit = useCreateDeposit()

  const activeMembers = members?.filter((m) => m.active) ?? []

  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const amountCents = Math.round(parseFloat(amount) * 100)
    if (!memberId || isNaN(amountCents) || amountCents <= 0) {
      setSubmitError('Please select a member and enter a valid amount.')
      return
    }

    try {
      await createDeposit.mutateAsync({
        memberId,
        amountCents,
        date,
        note: note.trim() || undefined,
      })
      // Clear form on success
      setMemberId('')
      setAmount('')
      setDate(todayISO())
      setNote('')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create deposit.')
    }
  }

  // Build a memberId → name lookup
  const memberMap = Object.fromEntries((members ?? []).map((m) => [m.id, m.name]))

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <h1
        className="text-2xl font-semibold mb-6 font-heading"
      >
        Deposits
      </h1>

      {/* New Deposit Form */}
      <Card className="mb-8 p-5">
        <CardContent className="p-0">
          <h2 className="text-base font-medium font-heading mb-4">New Deposit</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Member select */}
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="deposit-member">
                  Member
                </label>
                <select
                  id="deposit-member"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>Select member…</option>
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="deposit-amount">
                  Amount (€)
                </label>
                <Input
                  id="deposit-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="deposit-date">
                  Date
                </label>
                <Input
                  id="deposit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="deposit-note">
                  Note <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  id="deposit-note"
                  type="text"
                  placeholder="Optional note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Submit — full width */}
              <div className="md:col-span-2">
                {submitError && (
                  <p className="text-sm text-destructive mb-2">{submitError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={createDeposit.isPending}
                >
                  {createDeposit.isPending ? 'Adding…' : 'Add Deposit'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Deposit list */}
      {depositsLoading && (
        <p className="text-muted-foreground text-sm">Loading deposits…</p>
      )}

      {depositsError && (
        <p className="text-sm text-destructive">Failed to load deposits. Please try again.</p>
      )}

      {!depositsLoading && !depositsError && deposits && (
        <div>
          {deposits.length === 0 && (
            <p className="text-muted-foreground text-sm">No deposits yet.</p>
          )}
          {deposits.map((deposit) => (
            <div
              key={deposit.id}
              className={`flex items-center justify-between py-4 border-b border-border ${deposit.voided ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {/* TODO: memberName not on Deposit type — displaying via cross-reference */}
                  {memberMap[deposit.memberId] ?? deposit.memberId}
                </span>
                <span className="text-xs text-muted-foreground">{deposit.date}</span>
                {deposit.note && (
                  <span className="text-xs text-muted-foreground">{deposit.note}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums font-medium text-sm">
                  {formatCents(deposit.amountCents)}
                </span>
                {deposit.voided && (
                  <Badge variant="destructive" className="text-xs">Voided</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
