import type {
  FinanceCategory,
  FinanceTransaction,
} from '../../../types/finance'
import {
  getFinanceSummary,
  getMonthlyTransactions,
} from '../../../utils/finance'

export type CategoryExpensePreviewItem = {
  name: string
  amount: number
  percentage: number
  color: string
}

export type WeeklySpendingPoint = {
  label: string
  amount: number
}

export type IncomeExpenseSummary = {
  income: number
  expense: number
  balance: number
  totalTransactions: number
}

const fallbackCategoryColors = [
  '#ef4444',
  '#f97316',
  '#14b8a6',
  '#ec4899',
  '#8b5cf6',
  '#6366f1',
  '#64748b',
  '#0ea5e9',
]

export function getMonthlyFinancialOverview(
  transactions: FinanceTransaction[],
) {
  const monthTransactions = getMonthlyTransactions(
    transactions,
    new Date().toISOString().slice(0, 7),
  )
  const allTimeSummary = getFinanceSummary(transactions)
  const monthlySummary = getFinanceSummary(monthTransactions)

  return {
    balance: allTimeSummary.currentBalance,
    monthlyIncome: monthlySummary.totalIncome,
    monthlyExpense: monthlySummary.totalExpense,
  }
}

export function getMonthlyIncomeExpenseSummary(
  transactions: FinanceTransaction[],
): IncomeExpenseSummary {
  const monthTransactions = getMonthlyTransactions(
    transactions,
    new Date().toISOString().slice(0, 7),
  )
  const summary = getFinanceSummary(monthTransactions)

  return {
    income: summary.totalIncome,
    expense: summary.totalExpense,
    balance: summary.currentBalance,
    totalTransactions: summary.totalTransactions,
  }
}

export function getTopExpenseCategories(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
  limit = 3,
) {
  const monthTransactions = getMonthlyTransactions(
    transactions,
    new Date().toISOString().slice(0, 7),
  )
  const expenseTotals = monthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce<Record<string, number>>((totals, transaction) => {
      const key = transaction.categoryName || 'Tanpa kategori'

      totals[key] = (totals[key] ?? 0) + transaction.amount

      return totals
    }, {})
  const totalExpense = Object.values(expenseTotals).reduce(
    (total, amount) => total + amount,
    0,
  )

  if (totalExpense === 0) {
    return []
  }

  return Object.entries(expenseTotals)
    .sort(([, amountA], [, amountB]) => amountB - amountA)
    .slice(0, limit)
    .map(([name, amount], index) => ({
      name,
      amount,
      percentage: (amount / totalExpense) * 100,
      color:
        categories.find((category) => category.name === name)?.color ??
        fallbackCategoryColors[index % fallbackCategoryColors.length],
    }))
}

export function getWeeklySpendingTrend(
  transactions: FinanceTransaction[],
): WeeklySpendingPoint[] {
  const today = new Date()

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)

    date.setDate(today.getDate() - (6 - index))

    const dateKey = toDateKey(date)
    const amount = transactions
      .filter(
        (transaction) =>
          transaction.type === 'expense' && transaction.date === dateKey,
      )
      .reduce((total, transaction) => total + transaction.amount, 0)

    return {
      label: new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
      }).format(date),
      amount,
    }
  })
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}
