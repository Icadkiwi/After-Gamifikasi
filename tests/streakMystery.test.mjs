import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyStreakProtection,
  getStreakGiftDefinition,
  getStreakState,
  streakGifts,
  syncStreakFromLearningProfile,
} from '../src/gamification/streak/streakService.ts'
import { getUserStats } from '../src/gamification/rewards/gamificationService.ts'
import { getLocalDateKey } from '../src/utils/date.ts'
import { createLearningProfile } from '../src/learning/progress/profile.ts'
import { LocalLearningRepository } from '../src/services/persistence/learningRepository.ts'
import { getMysteryMissionForDate, checkMysteryAnswer } from '../src/gamification/mystery/mysteryMission.ts'
import { getCommunityProgressSnapshot } from '../src/gamification/community/communityGoal.ts'
import { learningModules, assessments, learningChallenges } from '../src/learning/modules/catalog.ts'

function setupStorage() {
  const storedValues = new Map()
  globalThis.localStorage = {
    getItem: (key) => storedValues.get(key) ?? null,
    setItem: (key, value) => storedValues.set(key, String(value)),
    removeItem: (key) => storedValues.delete(key),
    clear: () => storedValues.clear(),
  }
  globalThis.window = Object.assign(new EventTarget(), { setTimeout, clearTimeout })
  return storedValues
}

function dateAt(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000)
}

// Fixed local base time so day gaps in cross-day tests are deterministic
// regardless of when the suite runs.
const BASE_DAY = new Date(2026, 8, 30, 10, 0, 0)

function dayAt(base, days) {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

function activeProfileToday(uid, now) {
  // Simulates the authoritative learning service having written progress today.
  const repository = new LocalLearningRepository()
  const profile = createLearningProfile(uid)
  profile.updatedAt = now.toISOString()
  repository.save(profile)
  return profile
}

test('streak starts at one on the first valid learning day', () => {
  setupStorage()
  const uid = 'streak-new'
  const now = new Date()
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, now), now)
  const state = getStreakState(uid, now)
  assert.equal(state.currentStreak, 1)
  assert.equal(state.lastActiveDate, getLocalDateKey(now))
})

test('same-day learning does not increment the streak twice', () => {
  setupStorage()
  const uid = 'streak-same-day'
  const now = new Date()
  const profile = activeProfileToday(uid, now)
  syncStreakFromLearningProfile(uid, profile, now)
  syncStreakFromLearningProfile(uid, profile, now)
  syncStreakFromLearningProfile(uid, profile, dateAt(3))
  assert.equal(getStreakState(uid, now).currentStreak, 1)
})

test('next-day valid learning increments the streak', () => {
  setupStorage()
  const uid = 'streak-next-day'
  const day1 = dayAt(BASE_DAY, 0)
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, day1), day1)
  const day2 = dayAt(BASE_DAY, 1)
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, day2), day2)
  const state = getStreakState(uid, day2)
  assert.equal(state.currentStreak, 2)
  assert.equal(state.bestStreak, 2)
})

test('missing a day resets the streak to zero without touching other progress', () => {
  setupStorage()
  const uid = 'streak-missed'
  const day1 = dayAt(BASE_DAY, 0)
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, day1), day1)
  const statsBefore = getUserStats(uid)
  const day3 = dayAt(BASE_DAY, 2)
  const state = getStreakState(uid, day3)
  assert.equal(state.currentStreak, 0)
  assert.equal(state.bestStreak, 1)
  assert.deepEqual(getUserStats(uid), statsBefore)
})

test('streak protection carries exactly one missed day', () => {
  setupStorage()
  const uid = 'streak-protected'
  const day1 = dayAt(BASE_DAY, 0)
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, day1), day1)
  const day2 = dayAt(BASE_DAY, 1)
  assert.equal(applyStreakProtection(uid, day2).used, true)
  assert.equal(getStreakState(uid, day2).currentStreak, 1)
  assert.equal(getStreakState(uid, day2).protectionUsedDate, getLocalDateKey(day2))
  // Already protected today: a second call must not consume anything new.
  assert.equal(applyStreakProtection(uid, day2).used, false)
  // Learning on the protected day continues the streak instead of restarting.
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, day2), day2)
  assert.equal(getStreakState(uid, day2).currentStreak, 2)
  // The following day without learning still ends the streak.
  const day4 = dayAt(BASE_DAY, 3)
  assert.equal(getStreakState(uid, day4).currentStreak, 0)
})

test('protection never fabricates a streak for inactive users', () => {
  setupStorage()
  const uid = 'streak-protection-inactive'
  assert.equal(applyStreakProtection(uid).used, false)
  assert.equal(getStreakState(uid).currentStreak, 0)
})

test('streak milestone gift is deterministic, granted once and recorded as receipt', () => {
  setupStorage()
  const uid = 'streak-gift'
  const day1 = dayAt(BASE_DAY, 0)
  const first = syncStreakFromLearningProfile(uid, activeProfileToday(uid, day1), day1)
  assert.equal(first.streakIncremented, true)
  assert.equal(first.giftEvents.length, 0)

  const day2 = dayAt(BASE_DAY, 1)
  const result2 = syncStreakFromLearningProfile(uid, activeProfileToday(uid, day2), day2)
  assert.equal(result2.giftEvents.length, 0)
  const day3 = dayAt(BASE_DAY, 2)
  const result3 = syncStreakFromLearningProfile(uid, activeProfileToday(uid, day3), day3)
  assert.equal(result3.giftEvents.length, 1)
  assert.equal(result3.giftEvents[0].granted, true)
  assert.equal(result3.giftEvents[0].gift.streakDays, 3)

  const stats = getUserStats(uid)
  assert.ok(stats.learningRewardReceipts.includes('streak-milestone:3'))
  // Diamonds arrived through the existing wallet; EXP untouched by the gift.
  assert.equal(stats.diamond, 20)

  // Re-recording the same milestone (reload/retry) cannot pay twice.
  const day4 = dayAt(BASE_DAY, 3)
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, day4), day4)
  const replayed = getUserStats(uid)
  assert.equal(replayed.learningRewardReceipts.filter((id) => id === 'streak-milestone:3').length, 1)
  assert.equal(replayed.diamond, 20)
})

test('gift definitions are predetermined and never chance-based', () => {
  for (const gift of streakGifts) {
    assert.ok(Number.isInteger(gift.streakDays) && gift.streakDays > 0)
    assert.ok(Array.isArray(gift.rewards) && gift.rewards.length > 0)
    for (const reward of gift.rewards) {
      assert.ok(Number.isFinite(reward.amount) && reward.amount >= 0)
    }
  }
  assert.equal(getStreakGiftDefinition(3).streakDays, 3)
  assert.equal(getStreakGiftDefinition(999), undefined)
})

test('no mastery, competencies or learning progress from streak, gift, coins or city state', () => {
  setupStorage()
  const uid = 'streak-no-mastery'
  const repository = new LocalLearningRepository()
  const before = repository.load(uid)
  const now = new Date()
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, now), now)
  const day2 = dateAt(25)
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, day2), day2)
  const day3 = dateAt(49)
  syncStreakFromLearningProfile(uid, activeProfileToday(uid, day3), day3)
  const after = repository.load(uid)
  assert.deepEqual(after.competencies, before.competencies)
  assert.deepEqual(after.completedModules, before.completedModules)
  assert.deepEqual(after.completedChallenges, before.completedChallenges)
  assert.deepEqual(after.assessmentResults, before.assessmentResults)
  assert.deepEqual(after.practiceResults, before.practiceResults)
  assert.equal(after.overallScore, null)
})

test('streak state is isolated per user id', () => {
  setupStorage()
  const now = new Date()
  syncStreakFromLearningProfile('user-a', activeProfileToday('user-a', now), now)
  assert.equal(getStreakState('user-a', now).currentStreak, 1)
  assert.equal(getStreakState('user-b', now).currentStreak, 0)
})

test('invalid user ids and malformed profiles fail safely', () => {
  setupStorage()
  assert.equal(getStreakState('').currentStreak, 0)
  assert.equal(applyStreakProtection('').used, false)
  syncStreakFromLearningProfile('streak-safe', { updatedAt: 'not-a-date' })
  assert.equal(getStreakState('streak-safe').currentStreak, 0)
  syncStreakFromLearningProfile('streak-safe', { updatedAt: null })
  assert.equal(getStreakState('streak-safe').currentStreak, 0)
  syncStreakFromLearningProfile('streak-safe', {})
  assert.equal(getStreakState('streak-safe').currentStreak, 0)
})

test('mystery mission rotates deterministically from the validated catalog', () => {
  const today = getLocalDateKey(new Date())
  const mission = getMysteryMissionForDate(today)
  assert.ok(mission)
  const sameDate = getMysteryMissionForDate(today)
  assert.deepEqual(mission, sameDate)
  // The question must come from the real catalog.
  const catalogQuestion = assessments
    .flatMap((assessment) => assessment.questions)
    .find((question) => question.id === mission.questionId)
  assert.ok(catalogQuestion)
  assert.equal(mission.prompt, catalogQuestion.prompt)
  // Answer checking matches the catalog key.
  assert.equal(checkMysteryAnswer(mission, catalogQuestion.correctOptionId).correct, true)
  assert.equal(checkMysteryAnswer(mission, 'wrong-option').correct, false)
  assert.equal(checkMysteryAnswer(mission, undefined).correct, false)
  // A different date can resolve differently without any randomness.
  const fixedDates = ['2026-01-01', '2026-01-02', '2026-03-15']
  for (const dateKey of fixedDates) {
    const fixed = getMysteryMissionForDate(dateKey)
    assert.ok(fixed)
    assert.deepEqual(fixed, getMysteryMissionForDate(dateKey))
  }
})

test('mystery mission rejects invalid dates', () => {
  assert.equal(getMysteryMissionForDate(''), null)
  assert.equal(getMysteryMissionForDate('2026-13-99'), null)
  assert.equal(getMysteryMissionForDate('injection'), null)
  assert.equal(getMysteryMissionForDate(undefined), null)
})

test('existing learning catalog stays untouched by gamification modules', () => {
  // Catalog invariants used by deterministic services remain intact.
  assert.ok(learningModules.length > 0)
  assert.ok(learningChallenges.every((challenge) => challenge.passingScore === 80))
})

test('community goal contract is explicitly inactive without fake data', () => {
  const snapshot = getCommunityProgressSnapshot()
  assert.equal(snapshot.isActive, false)
  assert.equal(snapshot.backendRequired, true)
  assert.equal(snapshot.contributedCount, 0)
})
