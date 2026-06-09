import { useEffect, useMemo, useState, type FormEvent } from 'react'

import type {
  FinanceCategory,
  FinanceRecordType,
  FinanceTransaction,
  TransactionFormData,
} from '../../types/finance'
import { getCurrentDateKey } from '../../utils/finance'
import { formatNumericInput, parseNumericInput } from '../../utils/numeric-input'

type TransactionModalProps = {
  categories: FinanceCategory[]
  transaction?: FinanceTransaction | null
  onClose: () => void
  onSubmit: (transaction: TransactionFormData) => Promise<void>
}

export function TransactionModal({
  categories,
  transaction,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const [title, setTitle] = useState(transaction?.title ?? '')
  const [type, setType] = useState<FinanceRecordType>(
    transaction?.type ?? 'expense',
  )
  const [amount, setAmount] = useState(
    transaction ? formatNumericInput(transaction.amount) : '',
  )
  const [date, setDate] = useState(
    transaction?.date ?? getCurrentDateKey(),
  )
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [note, setNote] = useState(transaction?.note ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  )

  useEffect(() => {
    let isActive = true
    const hasSelectedCategory = filteredCategories.some(
      (category) => category.id === categoryId,
    )

    if (hasSelectedCategory) {
      return
    }

    queueMicrotask(() => {
      if (isActive) {
        setCategoryId(filteredCategories[0]?.id ?? '')
      }
    })

    return () => {
      isActive = false
    }
  }, [categoryId, filteredCategories])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const parsedAmount = parseNumericInput(amount)

    if (parsedAmount <= 0) {
      setError('Nominal transaksi harus lebih dari 0.')
      return
    }

    const selectedCategory = filteredCategories.find(
      (category) => category.id === categoryId,
    )

    setSubmitting(true)

    try {
      await onSubmit({
        title,
        type,
        amount: parsedAmount,
        date,
        categoryId: selectedCategory?.id ?? '',
        categoryName: selectedCategory?.name ?? 'Uncategorized',
        note: note.trim() || undefined,
      })
      onClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Transaksi gagal disimpan. Coba lagi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-zinc-950">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Type
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value as FinanceRecordType)
                }}
                className="rounded-md border border-zinc-300 px-3 py-2"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Amount
              <input
                value={amount}
                onChange={(event) =>
                  setAmount(formatNumericInput(parseNumericInput(event.target.value)))
                }
                required
                inputMode="numeric"
                className="rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Category
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2"
              >
                <option value="">Uncategorized</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-md bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:bg-zinc-300"
        >
          {submitting ? 'Saving...' : 'Save Transaction'}
        </button>
      </form>
    </div>
  )
}
