import { useState, type SyntheticEvent } from 'react'

import {
  forceUnlockAchievement,
  forceUnlockAllAchievements,
  resetAchievementProgress,
  resetSingleAchievement,
} from '../../game/achievementService'
import { useAchievements } from '../../game/useAchievements'
import { resetUserFinanceData } from '../../lib/firestore-finance'

type AdminToolsModalProps = {
  uid: string
  onClose: () => void
  onResetCurrency: () => void
  onResetLevels: () => void
  onUpgradeLevels: () => void
  onResetCityBuildings: () => void
  onResetPlayerLevel: () => void
  onUpgradePlayerLevel: () => void
  onAdminAddCoins: (amount: number) => void
  onAdminAddDiamonds: (amount: number) => void
}

export function AdminToolsModal({
  uid,
  onClose,
  onResetCurrency,
  onResetLevels,
  onUpgradeLevels,
  onResetCityBuildings,
  onResetPlayerLevel,
  onUpgradePlayerLevel,
  onAdminAddCoins,
  onAdminAddDiamonds,
}: AdminToolsModalProps) {
  const { achievements, unlockedCount, totalCount } = useAchievements(uid)
  const [statusMessage, setStatusMessage] = useState('')
  const [isResettingFinance, setIsResettingFinance] = useState(false)

  function handleResetAchievements() {
    if (!window.confirm('Reset semua pencapaian akun ini?')) {
      return
    }

    resetAchievementProgress(uid)
    setStatusMessage('Pencapaian berhasil di-reset.')
  }

  function handleUnlockAllAchievements() {
    if (!window.confirm('Buka semua pencapaian untuk akun ini?')) {
      return
    }

    forceUnlockAllAchievements(uid)
    setStatusMessage('Semua pencapaian berhasil dibuka.')
  }

  function handleResetLevels() {
    if (!window.confirm('Reset semua level bangunan ke LV 1?')) {
      return
    }

    onResetLevels()
    setStatusMessage('Semua level bangunan berhasil di-reset ke LV 1.')
  }

  function handleUpgradeLevels() {
    onUpgradeLevels()
    setStatusMessage('Semua bangunan fungsional dinaikkan 1 level.')
  }

  function handleResetCityBuildings() {
    if (
      !window.confirm(
        'Reset semua bangunan kota? Hanya objek inti bawaan yang akan tersisa.',
      )
    ) {
      return
    }

    onResetCityBuildings()
    setStatusMessage('Bangunan kota di-reset. Objek inti tetap tersisa.')
  }

  function handleResetPlayerLevel() {
    if (!window.confirm('Reset level pemain dan EXP ke Level 1?')) {
      return
    }

    onResetPlayerLevel()
    setStatusMessage('Level pemain berhasil di-reset ke Level 1.')
  }

  function handleUpgradePlayerLevel() {
    onUpgradePlayerLevel()
    setStatusMessage('Level pemain dinaikkan 1 tingkat.')
  }

  async function handleResetFinanceData() {
    if (
      !window.confirm(
        'Reset semua data keuangan akun ini? Semua transaksi dan kategori akan dihapus.',
      )
    ) {
      return
    }

    setIsResettingFinance(true)
    setStatusMessage('')

    try {
      await resetUserFinanceData(uid)
      setStatusMessage('Data keuangan berhasil di-reset.')
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Data keuangan gagal di-reset.',
      )
    } finally {
      setIsResettingFinance(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/45 p-2 backdrop-blur-md sm:p-4"
      onClick={stopModalEvent}
      onContextMenu={stopModalEvent}
      onDoubleClick={stopModalEvent}
      onMouseDown={stopModalEvent}
      onMouseUp={stopModalEvent}
      onPointerCancel={stopModalEvent}
      onPointerDown={stopModalEvent}
      onPointerMove={stopModalEvent}
      onPointerUp={stopModalEvent}
      onTouchCancel={stopModalEvent}
      onTouchEnd={stopModalEvent}
      onTouchMove={stopModalEvent}
      onTouchStart={stopModalEvent}
      onWheel={stopModalEvent}
    >
      <div className="flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl sm:max-h-[88vh] sm:w-[min(980px,94vw)]">
        <div className="shrink-0 border-b border-zinc-200 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-yellow-600">
                Kontrol Admin
              </p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-950">
                Alat Manipulasi QA
              </h2>
              <p className="mt-1 text-sm text-zinc-950">
                {unlockedCount} / {totalCount} pencapaian terbuka.
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

          {statusMessage && (
            <p className="mt-3 rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-950">
              {statusMessage}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <section>
            <h3 className="text-base font-semibold text-zinc-950">
              Alat Mata Uang
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <AdminActionButton
                label="+500 Koin"
                tone="coin"
                onClick={() => onAdminAddCoins(500)}
              />
              <AdminActionButton
                label="+50 Berlian"
                tone="diamond"
                onClick={() => onAdminAddDiamonds(50)}
              />
              <AdminActionButton
                label="Reset Mata Uang"
                tone="danger"
                onClick={onResetCurrency}
              />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-base font-semibold text-zinc-950">
              Alat Data
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminActionButton
                label="Buka Semua Pencapaian"
                tone="success"
                onClick={handleUnlockAllAchievements}
              />
              <AdminActionButton
                label="Tingkatkan LV Pemain"
                tone="success"
                onClick={handleUpgradePlayerLevel}
              />
              <AdminActionButton
                label="Reset LV Pemain"
                tone="warning"
                onClick={handleResetPlayerLevel}
              />
              <AdminActionButton
                label="Tingkatkan LV Bangunan"
                tone="success"
                onClick={handleUpgradeLevels}
              />
              <AdminActionButton
                label="Reset LV Bangunan"
                tone="warning"
                onClick={handleResetLevels}
              />
              <AdminActionButton
                label="Reset Bangunan Kota"
                tone="danger"
                onClick={handleResetCityBuildings}
              />
              <AdminActionButton
                label="Reset Pencapaian"
                tone="warning"
                onClick={handleResetAchievements}
              />
              <AdminActionButton
                label={
                  isResettingFinance
                    ? 'Mereset Keuangan...'
                    : 'Reset Data Keuangan'
                }
                tone="danger"
                disabled={isResettingFinance}
                onClick={handleResetFinanceData}
              />
            </div>
          </section>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-zinc-950">
                Ubah Pencapaian
              </h3>
              <span className="text-xs font-semibold text-zinc-950">
                Buka atau reset satu lencana.
              </span>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {achievements.map((achievement) => (
                <article
                  key={achievement.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-50 p-2 ${
                        achievement.unlocked ? '' : 'opacity-40 grayscale'
                      }`}
                    >
                      <img
                        src={achievement.badgeImage}
                        alt={achievement.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-zinc-950">
                        {achievement.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase text-zinc-950">
                        {formatTierLabel(achievement.tier)} |{' '}
                        {formatStatusLabel(achievement.status)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const unlockedAchievement = forceUnlockAchievement(
                          uid,
                          achievement.id,
                        )

                        setStatusMessage(
                          unlockedAchievement
                            ? `${achievement.title} dibuka.`
                            : `${achievement.title} belum bisa dibuka. Buka lencana sebelumnya dulu.`,
                        )
                      }}
                      className="min-h-10 rounded-md bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
                    >
                      Buka
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetSingleAchievement(uid, achievement.id)
                        setStatusMessage(`${achievement.title} di-reset.`)
                      }}
                      className="min-h-10 rounded-md bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
                    >
                      Reset
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function stopModalEvent(event: SyntheticEvent) {
  event.stopPropagation()
}

type AdminActionButtonProps = {
  label: string
  tone: 'success' | 'warning' | 'danger' | 'coin' | 'diamond'
  disabled?: boolean
  onClick: () => void
}

function formatTierLabel(tier: string) {
  if (tier === 'bronze') {
    return 'Perunggu'
  }

  if (tier === 'silver') {
    return 'Perak'
  }

  return 'Emas'
}

function formatStatusLabel(status: string) {
  if (status === 'unlocked') {
    return 'Terbuka'
  }

  if (status === 'in-progress') {
    return 'Berjalan'
  }

  return 'Terkunci'
}

function AdminActionButton({
  label,
  tone,
  disabled = false,
  onClick,
}: AdminActionButtonProps) {
  const toneClassName =
    tone === 'coin'
      ? 'bg-yellow-400 text-zinc-950 hover:bg-yellow-500'
      : tone === 'diamond'
        ? 'bg-sky-500 text-white hover:bg-sky-600'
        : tone === 'success'
      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
      : tone === 'warning'
        ? 'bg-yellow-400 text-zinc-950 hover:bg-yellow-500'
        : 'bg-red-500 text-white hover:bg-red-600'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-12 rounded-md px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 ${toneClassName}`}
    >
      {label}
    </button>
  )
}
