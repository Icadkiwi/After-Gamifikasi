import { useMemo, useState } from 'react'

import { useFinance } from '../../contexts/finance-context'
import type { FinanceTransaction } from '../../types/finance'
import { getLocalDateKey, getLocalMonthKey } from '../../utils/date'
import {
  compareTransactionsByDate,
  formatDate,
  formatRupiah,
  getCurrentDateKey,
  getFinanceSummary,
} from '../../utils/finance'

type MutationPeriodMode = 'daily' | 'weekly' | 'monthly' | 'yearly'

type DateRange = {
  startDate: string
  endDate: string
}

const mutationPeriodModes: Array<{
  id: MutationPeriodMode
  label: string
}> = [
  { id: 'daily', label: 'Harian' },
  { id: 'weekly', label: 'Mingguan' },
  { id: 'monthly', label: 'Bulanan' },
  { id: 'yearly', label: 'Tahunan' },
]
const MAX_WEEKLY_PERIOD_DAYS = 7
const DAY_IN_MS = 24 * 60 * 60 * 1000

export function FinanceReports() {
  const { transactions } = useFinance()
  const today = getCurrentDateKey()
  const [activeMode, setActiveMode] = useState<MutationPeriodMode>('daily')
  const [dailyDate, setDailyDate] = useState(today)
  const [rangeStartDate, setRangeStartDate] = useState(() =>
    getCurrentWeekRange().startDate,
  )
  const [rangeEndDate, setRangeEndDate] = useState(() =>
    getCurrentWeekRange().endDate,
  )
  const [selectedMonth, setSelectedMonth] = useState(() => getLocalMonthKey())
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear().toString(),
  )
  const [periodWarning, setPeriodWarning] = useState('')
  const activeRange = getActiveDateRange({
    activeMode,
    dailyDate,
    rangeStartDate,
    rangeEndDate,
    selectedMonth,
    selectedYear,
  })
  const filteredTransactions = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.date >= activeRange.startDate &&
            transaction.date <= activeRange.endDate,
        )
        .sort(compareTransactionsByDate),
    [activeRange.endDate, activeRange.startDate, transactions],
  )
  const summary = getFinanceSummary(filteredTransactions)

  function handleRangeStartChange(nextStartDate: string) {
    const rawRange = normalizeDateRange(nextStartDate, rangeEndDate)
    const nextRange = clampWeeklyDateRange(rawRange)

    setRangeStartDate(nextRange.startDate)
    setRangeEndDate(nextRange.endDate)
    setPeriodWarning(getWeeklyRangeWarning(rawRange, nextRange))
  }

  function handleRangeEndChange(nextEndDate: string) {
    const rawRange = normalizeDateRange(rangeStartDate, nextEndDate)
    const nextRange = clampWeeklyDateRange(rawRange)

    setRangeStartDate(nextRange.startDate)
    setRangeEndDate(nextRange.endDate)
    setPeriodWarning(getWeeklyRangeWarning(rawRange, nextRange))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-950">Periode Mutasi</h3>
          <p className="text-sm text-zinc-950">
            Pilih periode spesifik untuk melihat mutasi pemasukan dan pengeluaran.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-md bg-zinc-100 p-1">
          {mutationPeriodModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setActiveMode(mode.id)
                setPeriodWarning('')
              }}
              className={`min-h-10 rounded-md px-3 py-2 text-sm font-semibold transition ${
                activeMode === mode.id
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-950 hover:text-zinc-950'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <MutationPeriodControls
            activeMode={activeMode}
            dailyDate={dailyDate}
            rangeStartDate={rangeStartDate}
            rangeEndDate={rangeEndDate}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onDailyDateChange={setDailyDate}
            onRangeStartDateChange={handleRangeStartChange}
            onRangeEndDateChange={handleRangeEndChange}
            onSelectedMonthChange={setSelectedMonth}
            onSelectedYearChange={setSelectedYear}
          />

          <div className="rounded-md bg-zinc-50 p-4">
            <p className="text-xs font-bold uppercase text-zinc-950">
              Periode Aktif
            </p>
            <p className="mt-2 text-lg font-semibold leading-snug text-zinc-950">
              {formatPeriodLabel(activeRange)}
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-950">
              {filteredTransactions.length} transaksi ditemukan.
            </p>
          </div>
        </div>
        {periodWarning && activeMode === 'weekly' && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {periodWarning}
          </p>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryMetric
          label="Total Pemasukan"
          value={formatRupiah(summary.totalIncome)}
          tone="income"
        />
        <SummaryMetric
          label="Total Pengeluaran"
          value={formatRupiah(summary.totalExpense)}
          tone="expense"
        />
        <SummaryMetric
          label="Saldo Saat Ini"
          value={formatRupiah(summary.currentBalance)}
          tone="balance"
        />
      </div>

      <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-zinc-950">
              Mutasi Transaksi
            </h4>
            <p className="text-sm text-zinc-950">
              Menampilkan data sesuai periode yang dipilih.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-950">
            {filteredTransactions.length} transaksi
          </span>
        </div>

        <TransactionMutationList transactions={filteredTransactions} />
      </section>
    </div>
  )
}

type MutationPeriodControlsProps = {
  activeMode: MutationPeriodMode
  dailyDate: string
  rangeStartDate: string
  rangeEndDate: string
  selectedMonth: string
  selectedYear: string
  onDailyDateChange: (value: string) => void
  onRangeStartDateChange: (value: string) => void
  onRangeEndDateChange: (value: string) => void
  onSelectedMonthChange: (value: string) => void
  onSelectedYearChange: (value: string) => void
}

function MutationPeriodControls({
  activeMode,
  dailyDate,
  rangeStartDate,
  rangeEndDate,
  selectedMonth,
  selectedYear,
  onDailyDateChange,
  onRangeStartDateChange,
  onRangeEndDateChange,
  onSelectedMonthChange,
  onSelectedYearChange,
}: MutationPeriodControlsProps) {
  if (activeMode === 'daily') {
    return (
      <div className="grid gap-3">
        <DateField
          label="Tanggal"
          value={dailyDate}
          onChange={onDailyDateChange}
        />
      </div>
    )
  }

  if (activeMode === 'weekly') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <DateField
          label="Dari Tanggal"
          value={rangeStartDate}
          onChange={onRangeStartDateChange}
        />
        <DateField
          label="Sampai Tanggal"
          value={rangeEndDate}
          min={rangeStartDate}
          max={addDaysToDateKey(rangeStartDate, MAX_WEEKLY_PERIOD_DAYS - 1)}
          onChange={onRangeEndDateChange}
        />
      </div>
    )
  }

  if (activeMode === 'monthly') {
    return (
      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-semibold text-zinc-950">
          Bulan dan Tahun
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => onSelectedMonthChange(event.target.value)}
            className="min-h-12 rounded-md border border-zinc-300 px-3 py-2 text-base font-semibold text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-2 text-sm font-semibold text-zinc-950">
        Tahun
        <input
          type="number"
          min="1900"
          max="2999"
          value={selectedYear}
          onChange={(event) => onSelectedYearChange(event.target.value)}
          className="min-h-12 rounded-md border border-zinc-300 px-3 py-2 text-base font-semibold text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>
    </div>
  )
}

type DateFieldProps = {
  label: string
  value: string
  min?: string
  max?: string
  onChange: (value: string) => void
}

function DateField({ label, value, min, max, onChange }: DateFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-zinc-950">
      {label}
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-md border border-zinc-300 px-3 py-2 text-base font-semibold text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
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
      <p className="text-sm font-semibold text-zinc-950">{label}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-950">{value}</p>
      <span
        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName}`}
      >
        {tone === 'balance'
          ? 'Arus bersih'
          : tone === 'income'
            ? 'Uang masuk'
            : 'Uang keluar'}
      </span>
    </article>
  )
}

type TransactionMutationListProps = {
  transactions: FinanceTransaction[]
}

function TransactionMutationList({ transactions }: TransactionMutationListProps) {
  if (transactions.length === 0) {
    return (
      <p className="mt-4 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-8 text-center text-sm font-medium text-zinc-950">
        Belum ada mutasi pada periode ini.
      </p>
    )
  }

  return (
    <div className="mt-4 grid max-h-96 gap-2 overflow-y-auto pr-1">
      {transactions.map((transaction) => (
        <article
          key={transaction.id}
          className="rounded-md border border-zinc-200 px-3 py-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">
                {transaction.title}
              </p>
              <p className="mt-0.5 text-xs font-medium text-zinc-950">
                {formatDate(transaction.date)} | {transaction.categoryName}
              </p>
            </div>
            <p
              className={`shrink-0 text-sm font-bold ${
                transaction.type === 'income'
                  ? 'text-emerald-700'
                  : 'text-red-600'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatRupiah(transaction.amount)}
            </p>
          </div>
          {transaction.note && (
            <p className="mt-2 text-xs leading-5 text-zinc-950">
              {transaction.note}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}

function getActiveDateRange({
  activeMode,
  dailyDate,
  rangeStartDate,
  rangeEndDate,
  selectedMonth,
  selectedYear,
}: {
  activeMode: MutationPeriodMode
  dailyDate: string
  rangeStartDate: string
  rangeEndDate: string
  selectedMonth: string
  selectedYear: string
}): DateRange {
  const safeDailyDate = dailyDate || getCurrentDateKey()
  const safeRangeStartDate = rangeStartDate || getCurrentDateKey()
  const safeRangeEndDate = rangeEndDate || safeRangeStartDate

  if (activeMode === 'daily') {
    return {
      startDate: safeDailyDate,
      endDate: safeDailyDate,
    }
  }

  if (activeMode === 'weekly') {
    return clampWeeklyDateRange(
      normalizeDateRange(safeRangeStartDate, safeRangeEndDate),
    )
  }

  if (activeMode === 'monthly') {
    const monthKey = normalizeMonthKey(selectedMonth)
    const [year, month] = monthKey.split('-').map(Number)
    const lastDate = new Date(year, month, 0)

    return {
      startDate: `${monthKey}-01`,
      endDate: getLocalDateKey(lastDate),
    }
  }

  const year = normalizeYear(selectedYear)

  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  }
}

function getCurrentWeekRange(): DateRange {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const startDate = new Date(now)

  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(now.getDate() + mondayOffset)

  const endDate = new Date(startDate)

  endDate.setDate(startDate.getDate() + 6)

  return {
    startDate: getLocalDateKey(startDate),
    endDate: getLocalDateKey(endDate),
  }
}

function formatPeriodLabel({ startDate, endDate }: DateRange) {
  if (startDate === endDate) {
    return formatDate(startDate)
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function normalizeDateRange(startDate: string, endDate: string): DateRange {
  if (startDate <= endDate) {
    return {
      startDate,
      endDate,
    }
  }

  return {
    startDate: endDate,
    endDate: startDate,
  }
}

function clampWeeklyDateRange(range: DateRange): DateRange {
  if (getInclusiveDayCount(range) <= MAX_WEEKLY_PERIOD_DAYS) {
    return range
  }

  return {
    startDate: range.startDate,
    endDate: addDaysToDateKey(range.startDate, MAX_WEEKLY_PERIOD_DAYS - 1),
  }
}

function getWeeklyRangeWarning(rawRange: DateRange, nextRange: DateRange) {
  if (getInclusiveDayCount(rawRange) <= MAX_WEEKLY_PERIOD_DAYS) {
    return ''
  }

  return `Periode mingguan maksimal ${MAX_WEEKLY_PERIOD_DAYS} hari. Tanggal akhir otomatis dibatasi ke ${formatDate(nextRange.endDate)}.`
}

function getInclusiveDayCount({ startDate, endDate }: DateRange) {
  const start = parseLocalDateKey(startDate)
  const end = parseLocalDateKey(endDate)

  if (!start || !end) {
    return 1
  }

  return Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS) + 1
}

function addDaysToDateKey(dateKey: string, dayCount: number) {
  const date = parseLocalDateKey(dateKey) ?? new Date()

  date.setDate(date.getDate() + dayCount)

  return getLocalDateKey(date)
}

function parseLocalDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  const date = new Date(year, month - 1, day)

  date.setHours(0, 0, 0, 0)

  return date
}

function normalizeYear(year: string) {
  const trimmedYear = year.trim()
  const parsedYear = Number(trimmedYear)

  if (!trimmedYear || !Number.isFinite(parsedYear)) {
    return new Date().getFullYear().toString()
  }

  return Math.min(Math.max(Math.trunc(parsedYear), 1900), 2999).toString()
}

function normalizeMonthKey(monthKey: string) {
  if (/^\d{4}-\d{2}$/.test(monthKey)) {
    return monthKey
  }

  return getLocalMonthKey()
}
