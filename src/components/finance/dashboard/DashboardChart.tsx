import type { FinanceTransaction } from '../../../types/finance'
import { IncomeExpenseDonutChart } from '../IncomeExpenseDonutChart'
import {
  getMonthlyIncomeExpenseSummary,
  type IncomeExpenseSummary,
} from './dashboard-utils'

type DashboardChartProps = {
  transactions: FinanceTransaction[]
}

export function DashboardChart({ transactions }: DashboardChartProps) {
  const monthlySummary = getMonthlyIncomeExpenseSummary(transactions)

  return (
    <section className="space-y-4">
      <IncomeExpenseChart summary={monthlySummary} />
    </section>
  )
}

type IncomeExpenseChartProps = {
  summary: IncomeExpenseSummary
}

function IncomeExpenseChart({ summary }: IncomeExpenseChartProps) {
  return (
    <IncomeExpenseDonutChart
      description="Ringkasan pemasukan dan pengeluaran bulan ini."
      income={summary.income}
      expense={summary.expense}
      balance={summary.balance}
      emptyMessage="Belum ada data transaksi."
    />
  )
}
