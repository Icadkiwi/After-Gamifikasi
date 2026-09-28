import { useState } from 'react'

import { useFinance } from '../../contexts/finance-context'
import type { FinanceRecordType, FinanceTransaction } from '../../types/finance'
import { formatDate, formatRupiah } from '../../utils/finance'
import { TransactionModal } from './transaction-modal'

type TransactionFilter = 'all' | FinanceRecordType
type DeleteConfirmationStep = 1 | 2

export function FinanceTransactions() {
  const {
    transactions,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance()
  const [filter, setFilter] = useState<TransactionFilter>('all')
  const [editingTransaction, setEditingTransaction] =
    useState<FinanceTransaction | null>(null)
  const [pendingDeleteTransaction, setPendingDeleteTransaction] =
    useState<FinanceTransaction | null>(null)
  const [deleteConfirmationStep, setDeleteConfirmationStep] =
    useState<DeleteConfirmationStep>(1)
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === 'all') {
      return true
    }

    return transaction.type === filter
  })

  function openDeleteConfirmation(transaction: FinanceTransaction) {
    setPendingDeleteTransaction(transaction)
    setDeleteConfirmationStep(1)
    setDeleteError('')
  }

  function closeDeleteConfirmation() {
    if (isDeletingTransaction) {
      return
    }

    setPendingDeleteTransaction(null)
    setDeleteConfirmationStep(1)
    setDeleteError('')
  }

  async function confirmDeleteTransaction() {
    if (!pendingDeleteTransaction) {
      return
    }

    if (deleteConfirmationStep === 1) {
      setDeleteConfirmationStep(2)
      setDeleteError('')
      return
    }

    setIsDeletingTransaction(true)
    setDeleteError('')

    try {
      await deleteTransaction(pendingDeleteTransaction.id)
      setPendingDeleteTransaction(null)
      setDeleteConfirmationStep(1)
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Transaksi gagal dihapus. Coba lagi.',
      )
    } finally {
      setIsDeletingTransaction(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-950">
            Transaksi
          </h3>
          <p className="text-sm text-zinc-950">
            Tambah, ubah, hapus, dan filter pemasukan atau pengeluaran.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTransaction(null)
            setIsModalOpen(true)
          }}
          className="min-h-11 w-full rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-green-600 sm:w-auto"
        >
          Tambah Transaksi
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'income', 'expense'] as TransactionFilter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`min-h-11 rounded-md px-3 py-2 text-sm font-semibold capitalize ${
              filter === item
                ? 'bg-green-500 text-zinc-950'
                : 'bg-zinc-100 text-zinc-950'
            }`}
          >
            {formatFilterLabel(item)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-200">
        {filteredTransactions.length === 0 ? (
          <p className="p-4 text-sm text-zinc-950">Belum ada transaksi.</p>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-950">
                    {transaction.title}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {formatTransactionTypeLabel(transaction.type)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-950">
                  {transaction.categoryName} | {formatDate(transaction.date)}
                </p>
                {transaction.note && (
                  <p className="mt-1 text-sm text-zinc-950">
                    {transaction.note}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <p
                  className={`w-full min-w-0 text-sm font-semibold md:w-auto md:min-w-32 ${
                    transaction.type === 'income'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatRupiah(transaction.amount)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTransaction(transaction)
                    setIsModalOpen(true)
                  }}
                  className="min-h-10 flex-1 rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-950 sm:flex-none"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => openDeleteConfirmation(transaction)}
                  className="min-h-10 flex-1 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-zinc-950 sm:flex-none"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <TransactionModal
          key={editingTransaction?.id ?? 'new-transaction'}
          categories={categories}
          transaction={editingTransaction}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(transaction) =>
            editingTransaction
              ? updateTransaction(editingTransaction.id, transaction)
              : addTransaction(transaction)
          }
        />
      )}

      {pendingDeleteTransaction && (
        <DeleteTransactionConfirmationModal
          transaction={pendingDeleteTransaction}
          step={deleteConfirmationStep}
          isDeleting={isDeletingTransaction}
          error={deleteError}
          onBack={() => {
            setDeleteConfirmationStep(1)
            setDeleteError('')
          }}
          onClose={closeDeleteConfirmation}
          onConfirm={confirmDeleteTransaction}
        />
      )}
    </div>
  )
}

type DeleteTransactionConfirmationModalProps = {
  transaction: FinanceTransaction
  step: DeleteConfirmationStep
  isDeleting: boolean
  error: string
  onBack: () => void
  onClose: () => void
  onConfirm: () => void
}

function DeleteTransactionConfirmationModal({
  transaction,
  step,
  isDeleting,
  error,
  onBack,
  onClose,
  onConfirm,
}: DeleteTransactionConfirmationModalProps) {
  const isFinalStep = step === 2

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center overflow-y-auto bg-black/40 px-3 py-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-red-600">
              Verifikasi {step} dari 2
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950">
              {isFinalStep ? 'Konfirmasi terakhir' : 'Hapus transaksi?'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="min-h-10 rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tutup
          </button>
        </div>

        <p className="mt-3 text-sm text-zinc-950">
          {isFinalStep
            ? 'Klik tombol merah sekali lagi untuk menghapus transaksi ini.'
            : 'Pastikan transaksi yang dipilih sudah benar sebelum lanjut.'}
        </p>

        <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-950">
                {transaction.title}
              </p>
              <p className="mt-1 text-sm text-zinc-950">
                {transaction.categoryName} | {formatDate(transaction.date)}
              </p>
            </div>
            <p
              className={`shrink-0 text-right text-sm font-semibold ${
                transaction.type === 'income'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatRupiah(transaction.amount)}
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {isFinalStep ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isDeleting}
              className="min-h-10 rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Kembali
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="min-h-10 rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className={`min-h-10 rounded-md px-4 py-2 text-sm font-semibold text-zinc-950 transition disabled:cursor-not-allowed disabled:bg-zinc-300 ${
              isFinalStep
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isDeleting
              ? 'Menghapus...'
              : isFinalStep
                ? 'Ya, hapus transaksi'
                : 'Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatFilterLabel(filter: TransactionFilter) {
  if (filter === 'all') {
    return 'Semua'
  }

  return formatTransactionTypeLabel(filter)
}

function formatTransactionTypeLabel(type: FinanceRecordType) {
  return type === 'income' ? 'Pemasukan' : 'Pengeluaran'
}
