import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import cityHallImageUrl from '../../../MBS_Toony_021523u/png/Buildings/Classic City Hall Icon.png'

import type { CityProgressState } from '../../game/GameEvents'

type CityHallModalProps = {
  cityProgress: CityProgressState
  onClose: () => void
}

type CityMilestone = {
  cityLevel: number
  label: string
}

// Predetermined city milestones describing existing mechanics only. They present
// progress; they do not gate learning or unlock anything by themselves.
const cityMilestones: readonly CityMilestone[] = Object.freeze([
  { cityLevel: 1, label: 'Kota Berdiri — awal perjalanan kotamu' },
  { cityLevel: 2, label: 'Kota Bertumbuh — bangunan layanan mulai hidup' },
  { cityLevel: 3, label: 'Kota Ramai — ekonomi kota makin kuat' },
  { cityLevel: 4, label: 'Kota Maju — kota menyala dengan aktivitas' },
])

function getMilestoneStatus(milestone: CityMilestone, cityLevel: number) {
  if (cityLevel >= milestone.cityLevel) return 'achieved'
  if (milestone.cityLevel === cityLevel + 1) return 'next'
  return 'upcoming'
}

export function CityHallModal({ cityProgress, onClose }: CityHallModalProps) {
  const nextMilestone = cityMilestones.find(
    (milestone) => getMilestoneStatus(milestone, cityProgress.cityLevel) === 'next',
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Balai Kota — Pusat Progres Kota"
        className="w-full max-w-md"
      >
        <Card className="glass-panel max-h-[85dvh] overflow-y-auto">
          <CardHeader className="items-center gap-2 text-center">
            <img
              src={cityHallImageUrl}
              alt=""
              aria-hidden="true"
              className="mx-auto h-16 w-16 object-contain"
            />
            <CardTitle className="text-lg font-bold">Balai Kota</CardTitle>
            <CardDescription className="text-xs font-semibold">
              Pusat perkembangan Financial City kamu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-accent px-2 py-2">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Level Kota</p>
                <p className="text-lg font-bold">{cityProgress.cityLevel}</p>
              </div>
              <div className="rounded-lg bg-accent px-2 py-2">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Bangunan</p>
                <p className="text-lg font-bold">{cityProgress.buildingCount}</p>
              </div>
              <div className="rounded-lg bg-accent px-2 py-2">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Koin / jam</p>
                <p className="text-lg font-bold">{cityProgress.passiveIncomePerHour}</p>
              </div>
            </div>

            <section>
              <h3 className="mb-1.5 text-sm font-bold">Milestone Kota</h3>
              <ul className="space-y-1.5">
                {cityMilestones.map((milestone) => {
                  const status = getMilestoneStatus(milestone, cityProgress.cityLevel)
                  return (
                    <li
                      key={milestone.cityLevel}
                      className={[
                        'flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
                        status === 'achieved'
                          ? 'border-emerald-400/60 bg-emerald-50 text-emerald-800'
                          : status === 'next'
                            ? 'border-amber-400/60 bg-amber-50 text-amber-800'
                            : 'border-border text-muted-foreground',
                      ].join(' ')}
                    >
                      <span aria-hidden="true">
                        {status === 'achieved' ? '✓' : status === 'next' ? '▶' : '○'}
                      </span>
                      <span>
                        Lv {milestone.cityLevel} — {milestone.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {nextMilestone ? (
                <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                  Milestone berikutnya terbuka saat kota mencapai level {nextMilestone.cityLevel}.
                </p>
              ) : (
                <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                  Semua milestone telah tercapai. Kota kamu luar biasa!
                </p>
              )}
            </section>

            <section>
              <h3 className="mb-1.5 text-sm font-bold">Kendaraan Kota</h3>
              <p className="text-xs font-semibold text-muted-foreground">
                {cityProgress.vehicleNpcCount > 0
                  ? `${cityProgress.vehicleNpcCount} kendaraan milikmu berkeliaran menghidupkan kota.`
                  : 'Belum ada kendaraan. Kendaraan milikmu akan muncul di jalan kota.'}
              </p>
            </section>

            <Button type="button" onClick={onClose} className="min-h-10 w-full font-semibold">
              Tutup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
