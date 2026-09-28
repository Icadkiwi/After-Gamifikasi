import type {
  DailyMission,
  DailyRewardLog,
} from '../../game/gamificationService'

import mentorVehicleUrl from '../../../MBS_Toony_021523u/png/Vehicles/taxi.png'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CardDescription,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
      <aside className="absolute bottom-2 right-2 z-20 flex w-[min(13.5rem,calc(100vw-1rem))] flex-col gap-2 sm:bottom-auto sm:right-4 sm:top-4">
        <DailyMissionFloatingButton
          completedCount={completedMissions}
          totalMissions={totalMissions}
          hasClaimableReward={hasClaimableReward}
          mentorImageUrl={mentorVehicleUrl}
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
    <div className="absolute inset-x-2 bottom-2 z-20 flex max-h-[calc(100dvh-1rem)] flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-[400px]">
      <aside className="glass-panel flex min-h-0 max-h-[min(72dvh,34rem)] flex-col overflow-hidden rounded-xl transition-all duration-300 motion-safe:animate-[missionPanelIn_180ms_ease-out] sm:max-h-[75dvh]">
        <div className="shrink-0 p-3">
          <MissionPanelHeader
            dialog={dialog}
            hasClaimableReward={hasClaimableReward}
          />

          <MissionStats
            completedMissions={completedMissions}
            totalMissions={totalMissions}
          />

          <MissionActionButtons
            onOpenTutorial={onOpenTutorial}
            onMinimize={onMinimize}
          />
        </div>

        <Separator />

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
  hasClaimableReward: boolean
}

function MissionPanelHeader({
  dialog,
  hasClaimableReward,
}: MissionPanelHeaderProps) {
  return (
    <header className="flex items-start gap-2.5">
      <div className="flex h-12 w-14 shrink-0 items-end justify-center rounded-lg bg-accent px-2 pb-1.5">
        <img
          src={mentorVehicleUrl}
          alt="NPC kendaraan mentor"
          className="max-h-9 max-w-full object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wide text-primary">
              Misi Harian
            </CardDescription>
            <CardTitle className="truncate text-base font-bold leading-tight">
              Mentor
            </CardTitle>
          </div>

          {hasClaimableReward && <Badge>Klaim!</Badge>}
        </div>

        <p className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-muted-foreground">
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
      title="Progres penyelesaian misi harian hari ini."
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Progres Hadiah Hari Ini
      </p>

      <div className="grid gap-2">
        <MissionSummaryItem
          label="Misi Harian"
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
      <Button
        type="button"
        variant="secondary"
        onClick={onOpenTutorial}
        className="h-10 flex-1 text-xs font-semibold"
      >
        Tutorial
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onMinimize}
        className="glass-panel h-10 flex-1 bg-card/90 text-xs font-semibold"
      >
        Kecilkan
      </Button>
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
      <Button
        type="button"
        variant="outline"
        onClick={onOpenShop}
        className="glass-panel h-11 bg-card/90 text-sm font-semibold text-foreground"
      >
        Toko
      </Button>
      <Button
        type="button"
        onClick={onOpenFinance}
        className="h-11 bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Keuangan
      </Button>
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
        <div className="rounded-lg border border-dashed border-border bg-muted p-4 text-center text-sm font-medium text-muted-foreground">
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
    <div className="rounded-lg bg-muted px-2.5 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  )
}
