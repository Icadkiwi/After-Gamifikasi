import { useMemo, useState } from 'react'

import { useFinance } from '../../contexts/finance-context'
import {
  formatRupiah,
  getFinanceSummary,
  getTransactionsByStatisticsPeriod,
  type FinanceStatisticsPeriod,
} from '../../utils/finance'
import { IncomeExpenseDonutChart } from './IncomeExpenseDonutChart'

const statisticsPeriods: Array<{
  id: FinanceStatisticsPeriod
  label: string
}> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
]

export function FinanceReports() {
  const { transactions } = useFinance()
  const [activePeriod, setActivePeriod] =
    useState<FinanceStatisticsPeriod>('monthly')
  const filteredTransactions = useMemo(
    () => getTransactionsByStatisticsPeriod(transactions, activePeriod),
    [activePeriod, transactions],
  )
  const summary = getFinanceSummary(filteredTransactions)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-950">Statistics</h3>
          <p className="text-sm text-zinc-500">
            Ringkasan income, expense, dan balance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-md bg-zinc-100 p-1">
          {statisticsPeriods.map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() => setActivePeriod(period.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                activePeriod === period.id
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryMetric
          label="Total Income"
          value={formatRupiah(summary.totalIncome)}
          tone="income"
        />
        <SummaryMetric
          label="Total Expense"
          value={formatRupiah(summary.totalExpense)}
          tone="expense"
        />
        <SummaryMetric
          label="Current Balance"
          value={formatRupiah(summary.currentBalance)}
          tone="balance"
        />
      </div>

      <IncomeExpenseDonutChart
        description="Mengikuti filter periode yang sedang aktif."
        income={summary.totalIncome}
        expense={summary.totalExpense}
        balance={summary.currentBalance}
        emptyMessage="Belum ada data transaksi pada periode ini."
      />
    </div>
  )
}

type SummaryMetricProps = {
  label: string
  value: string
  tone: 'income' | 'expense' | 'balance'
}

function SummaryMetric({ label, value, tone }: SummaryMetricProps) {
  const toneClassName =
    tone === 'income'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'expense'
        ? 'bg-red-50 text-red-700'
        : 'bg-sky-50 text-sky-700'

  return (
    <article className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-950">{value}</p>
      <span
        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName}`}
      >
        {tone === 'balance'
          ? 'Net flow'
          : tone === 'income'
            ? 'Money in'
            : 'Money out'}
      </span>
    </article>
  )
}
