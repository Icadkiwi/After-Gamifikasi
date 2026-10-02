// CD5 — Community Learning Milestone (data contract only).
// Real community aggregation requires an authoritative backend (server-side
// counters + Firestore rules + privacy decisions). Until that backend exists,
// this contract stays INACTIVE: no fake numbers, no hardcoded progress.

export type CommunityLearningGoal = Readonly<{
  goalId: string
  title: string
  targetCount: number
}>

export type CommunityProgressSnapshot = Readonly<{
  goalId: string
  contributedCount: number
  targetCount: number
  isActive: false
  backendRequired: true
}>

export const communityLearningGoal: CommunityLearningGoal = Object.freeze({
  goalId: 'community-learning-activities',
  title: 'Target Belajar Bersama Komunitas',
  targetCount: 1000,
})

// Returns the inactive snapshot; a future backend replaces this implementation.
export function getCommunityProgressSnapshot(): CommunityProgressSnapshot {
  return Object.freeze({
    goalId: communityLearningGoal.goalId,
    contributedCount: 0,
    targetCount: communityLearningGoal.targetCount,
    isActive: false,
    backendRequired: true,
  })
}
