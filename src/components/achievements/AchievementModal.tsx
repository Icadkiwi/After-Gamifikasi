import { useMemo, useState } from 'react'

import {
  achievementCategories,
  type AchievementCategory,
} from '../../game/achievementConfig'
import { useAchievements } from '../../game/useAchievements'
import type {
  Achievement,
  AchievementProgressItem,
} from '../../game/achievementService'

type AchievementModalProps = {
  uid: string
  onClose: () => void
}

export function AchievementModal({ uid, onClose }: AchievementModalProps) {
  const { achievements, unlockedCount, totalCount } = useAchievements(uid)
  const [activeCategory, setActiveCategory] =
    useState<AchievementCategory>('finance')
  const activeCategoryInfo = achievementCategories.find(
    (category) => category.id === activeCategory,
  )
  const visibleAchievements = useMemo(
    () =>
      achievements.filter(
        (achievement) => achievement.category === activeCategory,
      ),
    [activeCategory, achievements],
  )

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-2 backdrop-blur-md sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl sm:max-h-[86vh] sm:w-[min(980px,94vw)]">
        <div className="shrink-0 border-b border-zinc-200 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                Sistem Pencapaian
              </p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-950">
                Progres Lencana
              </h2>
              <p className="mt-1 text-sm text-zinc-950">
                {unlockedCount} / {totalCount} pencapaian terbuka
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Tutup
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto">
            {achievementCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`min-h-11 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeCategory === category.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {activeCategoryInfo && (
            <p className="mt-3 text-sm text-zinc-950">
              {activeCategoryInfo.description}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            {visibleAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type AchievementCardProps = {
  achievement: Achievement
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const statusLabel =
    achievement.status === 'unlocked'
      ? 'Terbuka'
      : achievement.status === 'in-progress'
        ? 'Berjalan'
        : 'Terkunci'
  const tierLabel =
    achievement.tier === 'bronze'
      ? 'Perunggu'
      : achievement.tier === 'silver'
        ? 'Perak'
        : 'Emas'
  const statusClassName =
    achievement.status === 'unlocked'
      ? 'bg-emerald-100 text-emerald-700'
      : achievement.status === 'in-progress'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-zinc-100 text-zinc-950'

  return (
    <article
      className={`flex flex-col rounded-lg border bg-white p-4 shadow-sm transition lg:min-h-[520px] ${
        achievement.isCurrent
          ? 'border-emerald-300 ring-2 ring-emerald-100'
          : 'border-zinc-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-50 p-2 ${
            achievement.unlocked ? '' : 'opacity-35 grayscale'
          }`}
        >
          <img
            src={achievement.badgeImage}
            alt={achievement.title}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              {tierLabel}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClassName}`}
            >
              {statusLabel}
            </span>
          </div>
          <h3 className="mt-2 text-base font-bold leading-snug text-zinc-950">
            {achievement.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-950">
            {achievement.description}
          </p>
        </div>
      </div>        <div className="mt-4">
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-zinc-950">
          <span>Progres</span>
          <span>
            {Math.floor(achievement.progressValue)} /{' '}
            {Math.floor(achievement.progressMax)}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              achievement.unlocked ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min(achievement.progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid flex-1 gap-2">
        {achievement.progressItems.map((item) => (
          <ProgressItemRow
            key={item.id}
            item={item}
            isAchievementCurrent={achievement.isCurrent}
          />
        ))}
      </div>

      <div className="mt-4 min-h-8 text-xs font-semibold text-zinc-950">
        {achievement.unlockedAt ? (
          <span>Terbuka: {formatUnlockedDate(achievement.unlockedAt)}</span>
        ) : achievement.reward ? (
          <span>Hadiah: {achievement.reward.label}</span>
        ) : null}
      </div>
    </article>
  )
}

type ProgressItemRowProps = {
  item: AchievementProgressItem
  isAchievementCurrent: boolean
}

function ProgressItemRow({
  item,
  isAchievementCurrent,
}: ProgressItemRowProps) {
  const requiredCount = item.requiredCount ?? 1
  const shouldShowCount = requiredCount > 1

  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        item.completed
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : isAchievementCurrent
            ? 'border-amber-200 bg-amber-50 text-zinc-950'
            : 'border-zinc-200 bg-zinc-50 text-zinc-950'
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            item.completed
              ? 'bg-emerald-500 text-white'
              : 'bg-zinc-200 text-zinc-950'
          }`}
        >
          {item.completed ? 'OK' : ''}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{item.label}</p>
          {shouldShowCount && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-950">
                <span>
                  {Math.min(item.count, requiredCount)} / {requiredCount}
                </span>
                <span>{Math.round(item.progressPercent)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(item.progressPercent, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatUnlockedDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
