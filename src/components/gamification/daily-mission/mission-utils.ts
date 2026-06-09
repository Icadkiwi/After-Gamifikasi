import type {
  DailyMission,
  DailyRewardLog,
} from '../../../game/gamificationService'

export function getNpcDialog(missions: DailyMission[]) {
  const unclaimedMission = missions.find(
    (mission) => mission.completed && !mission.claimed,
  )

  if (unclaimedMission) {
    return `Misi "${unclaimedMission.title}" sudah selesai. Ambil reward-nya sekarang.`
  }

  const firstInputMission = missions.find(
    (mission) => mission.id === 'input-1-expense',
  )

  if (firstInputMission && !firstInputMission.completed) {
    return 'Halo! Catat pengeluaran pertamamu hari ini untuk menyelesaikan misi, lalu klaim EXP dan Coin.'
  }

  const nextMission = missions.find(
    (mission) => !mission.completed && !mission.claimed,
  )

  if (nextMission) {
    return `Bagus. Lanjutkan misi "${nextMission.title}" untuk membuka reward berikutnya.`
  }

  return 'Semua misi harian sudah rapi. Besok aku siapkan tantangan baru.'
}

export function getMissionProgress(
  mission: DailyMission,
  missions: DailyMission[],
  dailyRewardLog: DailyRewardLog,
) {
  if (mission.requirement.action === 'allMissions') {
    const baseMissions = missions.filter(
      (item) => item.requirement.action !== 'allMissions',
    )
    const completedBaseMissions = baseMissions.filter(
      (item) => item.completed,
    ).length
    const target = Math.max(baseMissions.length, 1)

    return {
      current: completedBaseMissions,
      target,
      percent: Math.min((completedBaseMissions / target) * 100, 100),
    }
  }

  const current = dailyRewardLog.actionCounts[mission.requirement.action]
  const target = Math.max(mission.requirement.target, 1)

  return {
    current,
    target,
    percent: Math.min((current / target) * 100, 100),
  }
}

export function formatMissionReward(mission: DailyMission) {
  return mission.rewards
    .map((reward) => {
      if (reward.type === 'exp') {
        return `EXP +${reward.amount}`
      }

      if (reward.type === 'coin') {
        return `Coin +${reward.amount}`
      }

      return `Diamond +${reward.amount}`
    })
    .join(' + ')
}

export function getMissionIconLabel(mission: DailyMission, missionIndex: number) {
  if (mission.requirement.action === 'allMissions') {
    return 'ALL'
  }

  return String(missionIndex + 1)
}
