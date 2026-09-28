import { useFinance } from '../../contexts/finance-context'
import { useCityProgress } from '../../game/useCityProgress'
import {
  formatDate,
  formatRupiah,
  getRecentTransactions,
} from '../../utils/finance'
import { CitySummary } from './dashboard/CitySummary'
import { DashboardChart } from './dashboard/DashboardChart'
import { ExpenseCategoryPreview } from './dashboard/ExpenseCategoryPreview'
import { FinancialOverview } from './dashboard/FinancialOverview'

export function FinanceDashboard() {
  const { transactions, categories, loading, error } = useFinance()
  const cityProgress = useCityProgress()
  const recentTransactions = getRecentTransactions(transactions)
  const hasTransactions = transactions.length > 0

  if (loading) {
    return <p className="text-sm text-zinc-950">Memuat data keuangan...</p>
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <FinancialOverview transactions={transactions} />

      {!hasTransactions && (
        <div className="rounded-md border border-dashed border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          Mulai catat transaksi pertamamu untuk melihat statistik keuangan.
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-4">
          <DashboardChart transactions={transactions} />

          <div className="grid gap-4 md:grid-cols-2">
            <ExpenseCategoryPreview
              transactions={transactions}
              categories={categories}
            />
            <CitySummary cityProgress={cityProgress} />
          </div>
        </div>
      </div>

      <RecentTransactions transactions={recentTransactions} />
    </div>
  )
}

type RecentTransactionsProps = {
  transactions: ReturnType<typeof getRecentTransactions>
}

function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-zinc-950">Transaksi Terbaru</h3>
      <div className="mt-3 overflow-hidden rounded-md border border-zinc-200">
        {transactions.length === 0 ? (
          <p className="p-4 text-sm text-zinc-950">
            Belum ada transaksi. Tambahkan transaksi pertama dari tab
            Transaksi.
          </p>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between gap-3 border-b border-zinc-100 p-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-950">
                  {transaction.title}
                </p>
                <p className="text-xs text-zinc-950">
                  {transaction.categoryName} | {formatDate(transaction.date)}
                </p>
              </div>
              <p
                className={`shrink-0 text-sm font-semibold ${
                  transaction.type === 'income'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatRupiah(transaction.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
