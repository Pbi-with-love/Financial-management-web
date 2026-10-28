import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers, useCreateExpense } from '@/api/hooks'
import { formatCents } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { CreateExpensePayload } from '@/api/types'

interface ItemState {
  description: string
  amount: string
  category: string
  participantIds: string[]
}

interface FormErrors {
  title?: string
  date?: string
  items: {
    description?: string
    participants?: string
  }[]
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function newItem(): ItemState {
  return { description: '', amount: '', category: '', participantIds: [] }
}

export default function NewExpense() {
  const navigate = useNavigate()
  const { data: allMembers = [] } = useMembers()
  const createExpense = useCreateExpense()

  const activeMembers = allMembers.filter((m) => m.active)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayString())
  const [note, setNote] = useState('')
  const [items, setItems] = useState<ItemState[]>([newItem()])
  const [errors, setErrors] = useState<FormErrors>({ items: [] })
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Running total in cents (for display only)
  const totalCents = items.reduce((sum, item) => {
    const parsed = parseFloat(item.amount)
    if (!isNaN(parsed) && parsed > 0) {
      return sum + Math.round(parsed * 100)
    }
    return sum
  }, 0)

  function updateItem(index: number, patch: Partial<ItemState>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function toggleParticipant(itemIndex: number, memberId: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item
        const has = item.participantIds.includes(memberId)
        return {
          ...item,
          participantIds: has
            ? item.participantIds.filter((id) => id !== memberId)
            : [...item.participantIds, memberId],
        }
      })
    )
  }

  function addItem() {
    setItems((prev) => [...prev, newItem()])
    setErrors((prev) => ({ ...prev, items: [...prev.items, {}] }))
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  function validate(): boolean {
    const newErrors: FormErrors = { items: [] }
    let valid = true

    if (!title.trim()) {
      newErrors.title = 'Title is required'
      valid = false
    }
    if (!date) {
      newErrors.date = 'Date is required'
      valid = false
    }

    for (const item of items) {
      const itemErr: { description?: string; participants?: string } = {}
      if (!item.description.trim()) {
        itemErr.description = 'Description is required'
        valid = false
      }
      if (item.participantIds.length === 0) {
        itemErr.participants = 'At least one participant is required'
        valid = false
      }
      newErrors.items.push(itemErr)
    }

    setErrors(newErrors)
    return valid
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    const payload: CreateExpensePayload = {
      title: title.trim(),
      date,
      note: note.trim() || undefined,
      items: items.map((item) => ({
        description: item.description.trim(),
        amountCents: Math.round((parseFloat(item.amount) || 0) * 100),
        category: item.category.trim() || undefined,
        participantIds: item.participantIds,
      })),
    }

    try {
      await createExpense.mutateAsync(payload)
      navigate('/')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create expense')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <h1
        className="text-2xl font-semibold text-foreground mb-6"
      >
        New Expense
      </h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Top fields */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                className="h-11 rounded-lg"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dinner at Luigi's"
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                className="h-11 rounded-lg"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={!!errors.date}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-destructive">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Note
              </label>
              <Input
                className="h-11 rounded-lg"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note"
              />
            </div>
          </CardContent>
        </Card>

        {/* Items section */}
        <div>
          <h2
            className="text-lg font-semibold text-foreground mb-3"
          >
            Items
          </h2>

          <div className="space-y-4">
            {items.map((item, index) => {
              const itemErr = errors.items[index] ?? {}
              return (
                <Card key={index}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                        className="text-destructive hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Description <span className="text-destructive">*</span>
                      </label>
                      <Input
                        className="h-11 rounded-lg"
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        placeholder="e.g. Pasta"
                        aria-invalid={!!itemErr.description}
                      />
                      {itemErr.description && (
                        <p className="mt-1 text-sm text-destructive">{itemErr.description}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Amount (€)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-11 rounded-lg"
                        value={item.amount}
                        onChange={(e) => updateItem(index, { amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Category
                      </label>
                      <Input
                        className="h-11 rounded-lg"
                        value={item.category}
                        onChange={(e) => updateItem(index, { category: e.target.value })}
                        placeholder="e.g. Food"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Participants <span className="text-destructive">*</span>
                      </label>
                      {activeMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active members found.</p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {activeMembers.map((member) => (
                            <label
                              key={member.id}
                              className="flex items-center gap-2 cursor-pointer select-none"
                            >
                              <Checkbox
                                checked={item.participantIds.includes(member.id)}
                                onCheckedChange={() => toggleParticipant(index, member.id)}
                              />
                              <span className="text-sm text-foreground">{member.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {itemErr.participants && (
                        <p className="mt-1 text-sm text-destructive">{itemErr.participants}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={addItem}
          >
            + Add item
          </Button>
        </div>

        {/* Running total */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <span
            className="text-base font-semibold text-foreground"
          >
            Total
          </span>
          <span className="text-base font-semibold text-foreground tabular-nums">
            {formatCents(totalCents)}
          </span>
        </div>

        {/* Submit */}
        <div className="space-y-2">
          <Button
            type="submit"
            variant="default"
            className="w-full md:w-auto h-11"
            disabled={createExpense.isPending}
          >
            {createExpense.isPending ? 'Creating…' : 'Create Expense'}
          </Button>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
        </div>
      </form>
    </div>
  )
}
