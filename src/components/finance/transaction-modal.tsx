import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'

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
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null)

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  )
  const selectedCategory = filteredCategories.find(
    (category) => category.id === categoryId,
  )

  useEffect(() => {
    let isActive = true
    const hasSelectedCategory = filteredCategories.some(
      (category) => category.id === categoryId,
    )

    if (hasSelectedCategory) {
      return
    }

    if (categoryId === '') {
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

  useEffect(() => {
    if (!isCategoryDropdownOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        categoryDropdownRef.current?.contains(event.target as Node)
      ) {
        return
      }

      setIsCategoryDropdownOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCategoryDropdownOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCategoryDropdownOpen])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const parsedAmount = parseNumericInput(amount)

    if (parsedAmount <= 0) {
      setError('Nominal transaksi harus lebih dari 0.')
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        title,
        type,
        amount: parsedAmount,
        date,
        categoryId: selectedCategory?.id ?? '',
        categoryName: selectedCategory?.name ?? 'Tanpa kategori',
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/35 px-3 py-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-zinc-950">
            {transaction ? 'Ubah Transaksi' : 'Tambah Transaksi'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-zinc-950"
          >
            Tutup
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-medium text-zinc-950">
            Judul
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-base"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-950">
              Jenis
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value as FinanceRecordType)
                }}
                className="min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-base"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-950">
              Nominal
              <input
                value={amount}
                onChange={(event) =>
                  setAmount(formatNumericInput(parseNumericInput(event.target.value)))
                }
                required
                inputMode="numeric"
                className="min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-base"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-950">
              Tanggal
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-base"
              />
            </label>

            <div
              ref={categoryDropdownRef}
              className="relative grid gap-1 text-sm font-medium text-zinc-950"
            >
              <span>Kategori</span>
              <button
                type="button"
                onClick={() =>
                  setIsCategoryDropdownOpen((isOpen) => !isOpen)
                }
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-base text-zinc-950 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                aria-expanded={isCategoryDropdownOpen}
                aria-haspopup="listbox"
              >
                <span className="min-w-0 truncate">
                  {selectedCategory?.name ?? 'Tanpa kategori'}
                </span>
                <span
                  aria-hidden="true"
                  className={`shrink-0 text-zinc-950 transition ${
                    isCategoryDropdownOpen ? 'rotate-180' : ''
                  }`}
                >
                  v
                </span>
              </button>

              {isCategoryDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-[1010] mt-1 max-h-[8.25rem] overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-xl"
                >
                  <CategoryOptionButton
                    label="Tanpa kategori"
                    selected={categoryId === ''}
                    onSelect={() => {
                      setCategoryId('')
                      setIsCategoryDropdownOpen(false)
                    }}
                  />
                  {filteredCategories.map((category) => (
                    <CategoryOptionButton
                      key={category.id}
                      label={category.name}
                      selected={category.id === categoryId}
                      onSelect={() => {
                        setCategoryId(category.id)
                        setIsCategoryDropdownOpen(false)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <label className="grid gap-1 text-sm font-medium text-zinc-950">
            Catatan
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="min-h-24 rounded-md border border-zinc-300 px-3 py-2 text-base"
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
          className="mt-5 min-h-11 w-full rounded-md bg-green-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-green-600 disabled:bg-zinc-300"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </form>
    </div>
  )
}

type CategoryOptionButtonProps = {
  label: string
  selected: boolean
  onSelect: () => void
}

function CategoryOptionButton({
  label,
  selected,
  onSelect,
}: CategoryOptionButtonProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`flex min-h-11 w-full items-center px-3 py-2 text-left text-sm font-semibold transition ${
        selected
          ? 'bg-emerald-500 text-zinc-950'
          : 'bg-white text-zinc-950 hover:bg-emerald-50 hover:text-emerald-700'
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
    </button>
  )
}
