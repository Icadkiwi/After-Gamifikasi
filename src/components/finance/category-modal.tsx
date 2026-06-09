import { useState, type FormEvent } from 'react'

import type {
  CategoryFormData,
  FinanceCategory,
  FinanceRecordType,
} from '../../types/finance'

type CategoryModalProps = {
  category?: FinanceCategory | null
  onClose: () => void
  onSubmit: (category: CategoryFormData) => Promise<void>
}

export function CategoryModal({
  category,
  onClose,
  onSubmit,
}: CategoryModalProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [type, setType] = useState<FinanceRecordType>(
    category?.type ?? 'expense',
  )
  const [color, setColor] = useState(category?.color ?? '#22c55e')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await onSubmit({ name, type, color })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-zinc-950">
            {category ? 'Edit Category' : 'Add Category'}
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
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Type
            <select
              value={type}
              onChange={(event) => setType(event.target.value as FinanceRecordType)}
              className="rounded-md border border-zinc-300 px-3 py-2"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Color
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-10 rounded-md border border-zinc-300 px-2"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-md bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:bg-zinc-300"
        >
          {submitting ? 'Saving...' : 'Save Category'}
        </button>
      </form>
    </div>
  )
}
