import type {
  FinanceCategory,
  FinanceTransaction,
} from '../types/finance'
import { getLocalDateKey, getLocalMonthKey } from './date'

export type FinanceStatisticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export const defaultFinanceCategories: Array<
  Omit<FinanceCategory, 'id' | 'createdAt' | 'updatedAt'>
> = [
  { name: 'Makanan', type: 'expense', color: '#ef4444' },
  { name: 'Transportasi', type: 'expense', color: '#f97316' },
  { name: 'Kesehatan', type: 'expense', color: '#14b8a6' },
  { name: 'Tempat Tinggal', type: 'expense', color: '#8b5cf6' },
  { name: 'Hiburan', type: 'expense', color: '#ec4899' },
  { name: 'Pribadi', type: 'expense', color: '#6366f1' },
  { name: 'Lain-lain', type: 'expense', color: '#64748b' },
  { name: 'E-wallet / Isi Saldo', type: 'expense', color: '#0ea5e9' },
  { name: 'Pemasukan', type: 'income', color: '#22c55e' },
]

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export function getCurrentMonth() {
  return getLocalMonthKey()
}

export function getCurrentDateKey() {
  return getLocalDateKey()
}

export function getCurrentYear() {
  return new Date().getFullYear().toString()
}

export function getFinanceSummary(transactions: FinanceTransaction[]) {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  return {
    totalIncome,
    totalExpense,
    currentBalance: totalIncome - totalExpense,
    totalTransactions: transactions.length,
  }
}

export function getRecentTransactions(transactions: FinanceTransaction[]) {
  return [...transactions]
    .sort(compareTransactionsByDate)
    .slice(0, 5)
}

export function compareTransactionsByDate(
  firstTransaction: FinanceTransaction,
  secondTransaction: FinanceTransaction,
) {
  const dateCompare = secondTransaction.date.localeCompare(firstTransaction.date)

  if (dateCompare !== 0) {
    return dateCompare
  }

  return (
    (secondTransaction.createdAt ?? 0) - (firstTransaction.createdAt ?? 0)
  )
}

export function getExpenseByCategory(transactions: FinanceTransaction[]) {
  return transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce<Record<string, number>>((totals, transaction) => {
      const key = transaction.categoryName || 'Tanpa kategori'

      totals[key] = (totals[key] ?? 0) + transaction.amount

      return totals
    }, {})
}

export function getCategoryTotals(transactions: FinanceTransaction[]) {
  return transactions.reduce<Record<string, number>>((totals, transaction) => {
    const key = transaction.categoryName || 'Tanpa kategori'

    totals[key] = (totals[key] ?? 0) + transaction.amount

    return totals
  }, {})
}

export function getTransactionsByStatisticsPeriod(
  transactions: FinanceTransaction[],
  period: FinanceStatisticsPeriod,
  now = new Date(),
) {
  if (period === 'daily') {
    const today = getLocalDateKey(now)

    return transactions.filter((transaction) => transaction.date === today)
  }

  if (period === 'weekly') {
    const { startDate, endDate } = getCurrentWeekRange(now)

    return transactions.filter(
      (transaction) =>
        transaction.date >= startDate && transaction.date <= endDate,
    )
  }

  if (period === 'monthly') {
    const month = getLocalMonthKey(now)

    return transactions.filter((transaction) => transaction.date.startsWith(month))
  }

  const year = getLocalDateKey(now).slice(0, 4)

  return transactions.filter((transaction) => transaction.date.startsWith(year))
}

function getCurrentWeekRange(now: Date) {
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const start = new Date(now)

  start.setHours(0, 0, 0, 0)
  start.setDate(now.getDate() + mondayOffset)

  const end = new Date(start)

  end.setDate(start.getDate() + 6)

  return {
    startDate: getLocalDateKey(start),
    endDate: getLocalDateKey(end),
  }
}

export function getMonthlyTransactions(
  transactions: FinanceTransaction[],
  month: string,
) {
  return transactions.filter((transaction) => transaction.date.startsWith(month))
}

export function getCategoriesByType(categories: FinanceCategory[]) {
  return {
    income: categories.filter((category) => category.type === 'income'),
    expense: categories.filter((category) => category.type === 'expense'),
  }
}
