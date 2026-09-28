import type { CityProgressState } from '../../../game/GameEvents'

type CitySummaryProps = {
  cityProgress: CityProgressState
}

export function CitySummary({ cityProgress }: CitySummaryProps) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-semibold text-zinc-950">Perkembangan Kota</h3>
        <p className="text-sm text-zinc-950">
          Ringkasan perkembangan kota gamifikasi.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <CityStat label="Bangunan" value={cityProgress.buildingCount} />
        <CityStat label="Kendaraan" value={cityProgress.vehicleNpcCount} />
        <CityStat
          label="Pemasukan Pasif"
          value={`+${cityProgress.passiveIncomePerHour} koin/jam`}
        />
        <CityStat label="Level Kota" value={cityProgress.cityLevel} />
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
      <p className="text-xs font-semibold uppercase text-zinc-950">{label}</p>
      <p className="mt-1 text-base font-semibold text-zinc-950">{value}</p>
    </div>
  )
}
