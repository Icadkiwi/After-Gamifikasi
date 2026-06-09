import type {
  DailyMission,
  DailyRewardLog,
} from '../../game/gamificationService'

import mentorVehicleUrl from '../../../MBS_Toony_021523u/png/Vehicles/taxi.png'

import { DailyMissionFloatingButton } from './daily-mission/DailyMissionFloatingButton'
import { MissionCard } from './daily-mission/MissionCard'
import { getNpcDialog } from './daily-mission/mission-utils'

type DailyMissionPanelProps = {
  missions: DailyMission[]
  dailyRewardLog: DailyRewardLog
  isMinimized: boolean
  onClaimMission: (missionId: string) => void
  onOpenTutorial: () => void
  onOpenShop: () => void
  onOpenFinance: () => void
  onMinimize: () => void
  onExpand: () => void
}

export function DailyMissionPanel({
  missions,
  dailyRewardLog,
  isMinimized,
  onClaimMission,
  onOpenTutorial,
  onOpenShop,
  onOpenFinance,
  onMinimize,
  onExpand,
}: DailyMissionPanelProps) {
  const totalMissions = missions.length
  const completedMissions = missions.filter((mission) => mission.completed).length
  const claimableMissions = missions.filter(
    (mission) => mission.completed && !mission.claimed,
  ).length
  const hasClaimableReward = claimableMissions > 0
  const dialog = getNpcDialog(missions)

  if (isMinimized) {
    return (
      <aside className="absolute bottom-4 right-4 z-20 flex w-[min(13.5rem,calc(100vw-1.5rem))] flex-col gap-2 sm:bottom-auto sm:right-4 sm:top-4">
        <DailyMissionFloatingButton
          completedCount={completedMissions}
          totalMissions={totalMissions}
          hasClaimableReward={hasClaimableReward}
          onExpand={onExpand}
        />
        <MissionQuickActions
          onOpenShop={onOpenShop}
          onOpenFinance={onOpenFinance}
        />
      </aside>
    )
  }

  return (
    <div className="absolute inset-x-3 bottom-4 z-20 flex max-h-[calc(100%-2rem)] flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-[400px]">
      <aside className="flex min-h-0 max-h-[min(76vh,34rem)] flex-col overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 motion-safe:animate-[missionPanelIn_180ms_ease-out] sm:max-h-[75vh]">
        <div className="shrink-0 border-b border-zinc-100 bg-white/95 p-3 backdrop-blur">
          <MissionPanelHeader dialog={dialog} />

          <MissionStats
            completedMissions={completedMissions}
            totalMissions={totalMissions}
          />

          <MissionActionButtons
            onOpenTutorial={onOpenTutorial}
            onMinimize={onMinimize}
          />
        </div>

        <MissionScrollableList
          missions={missions}
          dailyRewardLog={dailyRewardLog}
          onClaimMission={onClaimMission}
        />
      </aside>
      <MissionQuickActions
        onOpenShop={onOpenShop}
        onOpenFinance={onOpenFinance}
      />
    </div>
  )
}

type MissionPanelHeaderProps = {
  dialog: string
}

function MissionPanelHeader({
  dialog,
}: MissionPanelHeaderProps) {
  return (
    <header className="flex items-start gap-2.5">
      <div className="flex h-12 w-14 shrink-0 items-end justify-center rounded-xl bg-emerald-100 px-2 pb-1.5">
        <img
          src={mentorVehicleUrl}
          alt="NPC kendaraan mentor"
          className="max-h-9 max-w-full object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
              Daily Mission
            </p>
            <h2 className="truncate text-base font-bold leading-tight text-zinc-950">
              Kendaraan Mentor
            </h2>
          </div>

        </div>

        <p className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-zinc-600">
          {dialog}
        </p>
      </div>
    </header>
  )
}

type MissionStatsProps = {
  completedMissions: number
  totalMissions: number
}

function MissionStats({
  completedMissions,
  totalMissions,
}: MissionStatsProps) {
  return (
    <section
      className="mt-2.5 grid gap-2"
      title="Progress penyelesaian daily mission hari ini."
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
        Today's Reward Progress
      </p>

      <div className="grid gap-2">
        <MissionSummaryItem
          label="Daily Mission"
          value={`${completedMissions}/${totalMissions}`}
        />
      </div>
    </section>
  )
}

type MissionActionButtonsProps = {
  onOpenTutorial: () => void
  onMinimize: () => void
}

function MissionActionButtons({
  onOpenTutorial,
  onMinimize,
}: MissionActionButtonsProps) {
  return (
    <div className="mt-2.5 flex gap-2">
      <button
        type="button"
        onClick={onOpenTutorial}
        className="min-h-9 flex-1 rounded-xl bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm transition hover:bg-yellow-500 active:bg-yellow-600"
      >
        Tutorial
      </button>
      <button
        type="button"
        onClick={onMinimize}
        className="min-h-9 flex-1 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:bg-zinc-950"
      >
        Minimize
      </button>
    </div>
  )
}

type MissionQuickActionsProps = {
  onOpenShop: () => void
  onOpenFinance: () => void
}

function MissionQuickActions({
  onOpenShop,
  onOpenFinance,
}: MissionQuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onOpenShop}
        className="min-h-11 rounded-md border border-zinc-200 bg-white/92 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-sm backdrop-blur transition hover:bg-white"
      >
        Shop
      </button>
      <button
        type="button"
        onClick={onOpenFinance}
        className="min-h-11 rounded-md border border-green-200 bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600"
      >
        Finance
      </button>
    </div>
  )
}

type MissionScrollableListProps = {
  missions: DailyMission[]
  dailyRewardLog: DailyRewardLog
  onClaimMission: (missionId: string) => void
}

function MissionScrollableList({
  missions,
  dailyRewardLog,
  onClaimMission,
}: MissionScrollableListProps) {
  return (
    <div className="daily-mission-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
      {missions.length > 0 ? (
        <div className="grid gap-2">
          {missions.map((mission, index) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              missionIndex={index}
              missions={missions}
              dailyRewardLog={dailyRewardLog}
              onClaimMission={onClaimMission}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm font-medium text-zinc-500">
          Misi harian belum tersedia.
        </div>
      )}
    </div>
  )
}

type MissionSummaryItemProps = {
  label: string
  value: string
}

function MissionSummaryItem({ label, value }: MissionSummaryItemProps) {
  return (
    <div className="rounded-xl bg-zinc-100 px-2.5 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="truncate text-sm font-bold text-zinc-950">{value}</p>
    </div>
  )
}
