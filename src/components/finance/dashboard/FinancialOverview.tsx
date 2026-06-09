import type { FinanceTransaction } from '../../../types/finance'
import { formatRupiah } from '../../../utils/finance'
import { getMonthlyFinancialOverview } from './dashboard-utils'

type FinancialOverviewProps = {
  transactions: FinanceTransaction[]
}

export function FinancialOverview({ transactions }: FinancialOverviewProps) {
  const overview = getMonthlyFinancialOverview(transactions)

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <OverviewCard
        label="Balance"
        value={formatRupiah(overview.balance)}
        tone="balance"
      />
      <OverviewCard
        label="Income bulan ini"
        value={formatRupiah(overview.monthlyIncome)}
        tone="income"
      />
      <OverviewCard
        label="Expense bulan ini"
        value={formatRupiah(overview.monthlyExpense)}
        tone="expense"
      />
    </section>
  )
}

type OverviewCardProps = {
  label: string
  value: string
  tone: 'balance' | 'income' | 'expense'
}

function OverviewCard({ label, value, tone }: OverviewCardProps) {
  const accentClassName =
    tone === 'income'
      ? 'bg-emerald-500'
      : tone === 'expense'
        ? 'bg-red-500'
        : 'bg-sky-500'

  return (
    <article className="relative overflow-hidden rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <span
        className={`absolute left-0 top-0 h-full w-1 ${accentClassName}`}
      />
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-950">{value}</p>
    </article>
  )
}
