import { formatRupiah } from '../../utils/finance'

type IncomeExpenseDonutChartProps = {
  title?: string
  description: string
  income: number
  expense: number
  balance: number
  emptyMessage: string
}

const incomeColor = '#10b981'
const expenseColor = '#ef4444'

export function IncomeExpenseDonutChart({
  title = 'Pemasukan vs Pengeluaran',
  description,
  income,
  expense,
  balance,
  emptyMessage,
}: IncomeExpenseDonutChartProps) {
  const total = income + expense
  const hasData = income > 0 || expense > 0
  const slices = [
    {
      id: 'income',
      label: 'Pemasukan',
      amount: income,
      color: incomeColor,
      textClassName: 'text-emerald-700',
    },
    {
      id: 'expense',
      label: 'Pengeluaran',
      amount: expense,
      color: expenseColor,
      textClassName: 'text-red-700',
    },
  ]
  const visibleSlices = slices.filter((slice) => slice.amount > 0)

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-950">{title}</h3>
          <p className="text-sm text-zinc-950">{description}</p>
        </div>
        {hasData && (
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            Saldo {formatRupiah(balance)}
          </span>
        )}
      </div>

      {hasData ? (
        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(180px,240px)_1fr] md:items-center">
          <IncomeExpenseDonut slices={visibleSlices} total={total} />

          <div className="grid gap-3">
            <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-sm font-semibold text-zinc-950">Total</p>
              <p className="mt-2 text-base font-semibold text-zinc-950">
                {formatRupiah(total)}
              </p>
            </div>

            {slices.map((slice) => {
              const percentage = total > 0 ? (slice.amount / total) * 100 : 0

              return (
                <div
                  key={slice.id}
                  className="rounded-md border border-zinc-100 bg-zinc-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span
                        className={`truncate text-sm font-semibold ${slice.textClassName}`}
                      >
                        {slice.label}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-zinc-950">
                      {formatPercentage(percentage)}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-zinc-950">
                    {formatRupiah(slice.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center text-sm text-zinc-950">
          {emptyMessage}
        </div>
      )}
    </section>
  )
}

type IncomeExpenseDonutProps = {
  slices: Array<{
    id: string
    label: string
    amount: number
    color: string
  }>
  total: number
}

function IncomeExpenseDonut({ slices, total }: IncomeExpenseDonutProps) {
  const radius = 72
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[240px]">
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label="Grafik donat pemasukan dan pengeluaran"
        className="h-full w-full"
      >
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth="24"
        />

        {slices.map((slice, index) => {
          const dashLength = (slice.amount / total) * circumference
          const previousDashLength = slices
            .slice(0, index)
            .reduce(
              (sum, currentSlice) =>
                sum + (currentSlice.amount / total) * circumference,
              0,
            )

          return (
            <circle
              key={slice.id}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="24"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-previousDashLength}
              strokeLinecap="butt"
              className="transition-all duration-500 ease-out"
              transform="rotate(-90 100 100)"
            />
          )
        })}
      </svg>

    </div>
  )
}

function formatPercentage(value: number) {
  if (value === 0 || value === 100) {
    return `${value.toFixed(0)}%`
  }

  return `${value.toFixed(1)}%`
}
