import type { CityProgressState } from '../../../game/GameEvents'

type CitySummaryProps = {
  cityProgress: CityProgressState
}

export function CitySummary({ cityProgress }: CitySummaryProps) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-semibold text-zinc-950">City Progress</h3>
        <p className="text-sm text-zinc-500">
          Ringkasan perkembangan kota gamifikasi.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <CityStat label="Buildings" value={cityProgress.buildingCount} />
        <CityStat label="Vehicles" value={cityProgress.vehicleNpcCount} />
        <CityStat
          label="Passive Income"
          value={`+${cityProgress.passiveIncomePerCycle} Coin`}
        />
        <CityStat label="City Level" value={cityProgress.cityLevel} />
      </div>
    </section>
  )
}

type CityStatProps = {
  label: string
  value: number | string
}

function CityStat({ label, value }: CityStatProps) {
  return (
    <div className="rounded-md bg-zinc-50 p-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-zinc-950">{value}</p>
    </div>
  )
}
