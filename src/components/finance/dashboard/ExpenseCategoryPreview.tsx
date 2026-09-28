import type {
  FinanceCategory,
  FinanceTransaction,
} from '../../../types/finance'
import { formatRupiah } from '../../../utils/finance'
import { getTopExpenseCategories } from './dashboard-utils'

type ExpenseCategoryPreviewProps = {
  transactions: FinanceTransaction[]
  categories: FinanceCategory[]
}

export function ExpenseCategoryPreview({
  transactions,
  categories,
}: ExpenseCategoryPreviewProps) {
  const topCategories = getTopExpenseCategories(transactions, categories)

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-semibold text-zinc-950">Kategori Pengeluaran Teratas</h3>
        <p className="text-sm text-zinc-950">3 terbesar bulan ini.</p>
      </div>

      <div className="mt-4 grid gap-3">
        {topCategories.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-950">
            Mulai catat transaksi pertamamu untuk melihat statistik keuangan.
          </p>
        ) : (
          topCategories.map((category) => (
            <article key={category.name}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="truncate font-semibold text-zinc-950">
                    {category.name}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold text-zinc-950">
                  {category.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
              <p className="mt-1 text-xs font-semibold text-zinc-950">
                {formatRupiah(category.amount)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
