import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateStructuredAssessment, assessmentService } from '../src/services/assessment/assessmentService.ts'
import { learningRecommendationService } from '../src/services/recommendation/learningRecommendationService.ts'
import { practiceService } from '../src/services/practice/practiceService.ts'
import { updateCompetencyProfile } from '../src/services/learnerProfile/learnerProfileService.ts'
import { createLearningProfile } from '../src/learning/progress/profile.ts'
import { assessments, learningModules, learningChallenges } from '../src/learning/modules/catalog.ts'
import { createLearningService } from '../src/services/learning/learningService.ts'
import { LocalLearningRepository, learningStorageKey } from '../src/services/persistence/learningRepository.ts'
import { CuratedKnowledgeRepository } from '../src/services/knowledge/KnowledgeRepository.ts'
import { cityStorageKey } from '../src/game/city/storage.ts'
import { getLearningUnlockRequirement } from '../src/game/city/learningUnlocks.ts'
import { learningService } from '../src/services/learning/defaultLearningService.ts'
import { claimMissionReward, getUserStats, getDailyRewardLog, getDailyMissions, grantLearningCompletionReward, recordLearningMissionEvent } from '../src/gamification/rewards/gamificationService.ts'
import { getAchievementSnapshot } from '../src/gamification/achievements/achievementService.ts'
import { purchaseLearningShopItem } from '../src/services/gameProgressionService.ts'
import { dailyMissionDefinitions } from '../src/gamification/missions/missionConfig.ts'

beforeEach(() => {
  const values = new Map()
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key), clear: () => values.clear() }
  globalThis.window = Object.assign(new EventTarget(), { setTimeout, clearTimeout })
})
const at = '2026-09-29T10:00:00.000Z'
const definition = (id) => assessments.find((item) => item.id === id)
const answers = (id, correct = true) => definition(id).questions.map((question) => ({ questionId: question.id, optionId: correct ? question.correctOptionId : question.options.find((option) => option.id !== question.correctOptionId).id }))
function request(id = 'initial-v1', correct = true) { return { context: { userId: 'alice', requestId: 'attempt-1', now: at }, assessment: definition(id), answers: answers(id, correct) } }
function setup() {
  const events = []
  const service = createLearningService(new LocalLearningRepository(), { assessment: assessmentService, recommendation: learningRecommendationService, practice: practiceService }, { modules: learningModules, challenges: learningChallenges, assessments }, { onProgress: (_, next) => events.push(...next), getCityLevel: () => 1 })
  return { service, events }
}
function initial(service = learningService, uid = 'alice') { return service.assess(uid, 'initial-v1', answers('initial-v1', false), `${uid}-initial`, at) }
function completeBudget(service = learningService, uid = 'alice') {
  service.readModule(uid, 'budget-foundations', at)
  service.practice(uid, 'budget-challenge', 'practice', answers('budget-practice'), `${uid}-practice`, at)
  return service.practice(uid, 'budget-challenge', 'reassessment', answers('budget-reassessment'), `${uid}-reassessment`, at)
}

test('structured assessment grades answers with competency evidence, not a guessed label', () => {
  const result = evaluateStructuredAssessment(request())
  assert.equal(result.score, 100)
  assert.deepEqual(result.competencyScores, { budgeting: 100, 'digital-safety': 100 })
  assert.equal(result.evidence.length, 4)
  assert.equal(evaluateStructuredAssessment(request('initial-v1', false)).score, 0)
})
test('assessment rejects missing, duplicate, foreign and invalid answer options', () => {
  const value = request()
  for (const invalid of [value.answers.slice(1), [...value.answers, value.answers[0]], value.answers.map((item) => ({ ...item, optionId: 'missing' })), value.answers.map((item, index) => index === 0 ? { ...item, questionId: 'foreign' } : item)]) {
    assert.throws(() => evaluateStructuredAssessment({ ...value, answers: invalid }))
  }
})
test('misconfigured duplicate question IDs and answer keys are rejected', () => {
  const value = request()
  assert.throws(() => evaluateStructuredAssessment({ ...value, assessment: { ...value.assessment, questions: [value.assessment.questions[0], value.assessment.questions[0]] } }))
  assert.throws(() => evaluateStructuredAssessment({ ...value, assessment: { ...value.assessment, questions: value.assessment.questions.map((q) => ({ ...q, correctOptionId: 'unknown' })) } }))
})
test('weights determine score and unassessed competencies remain unknown', () => {
  const value = request()
  value.assessment = { ...value.assessment, questions: value.assessment.questions.map((q, index) => ({ ...q, weight: index === 0 ? 3 : 1 })) }
  value.answers[0].optionId = '0'
  const result = evaluateStructuredAssessment(value)
  assert.equal(result.score, 50)
  const profile = updateCompetencyProfile(createLearningProfile('alice'), result)
  assert.equal(profile.competencies.saving.score, null)
  assert.equal(profile.competencies.budgeting.score, 25)
  assert.throws(() => updateCompetencyProfile(createLearningProfile('bob'), result))
})
test('reading and practice do not masquerade as mastery or completion', () => {
  const { service, events } = setup()
  assert.throws(() => service.readModule('alice', 'budget-foundations'))
  initial(service)
  service.readModule('alice', 'budget-foundations')
  service.practice('alice', 'budget-challenge', 'practice', answers('budget-practice'), 'p1', at)
  const profile = service.getProfile('alice')
  assert.equal(profile.competencies.budgeting.score, 0)
  assert.deepEqual(profile.completedModules, [])
  assert.ok(!events.some((event) => event.type === 'LearningChallengeCompleted'))
})
test('reassessment requires reading and a passed practice; failure does not complete challenge', () => {
  const { service } = setup()
  initial(service)
  assert.throws(() => service.practice('alice', 'budget-challenge', 'practice', answers('budget-practice'), 'p1'))
  service.readModule('alice', 'budget-foundations')
  assert.throws(() => service.practice('alice', 'budget-challenge', 'reassessment', answers('budget-reassessment'), 'r1'))
  service.practice('alice', 'budget-challenge', 'practice', answers('budget-practice', false), 'p2')
  assert.throws(() => service.practice('alice', 'budget-challenge', 'reassessment', answers('budget-reassessment'), 'r2'))
  service.practice('alice', 'budget-challenge', 'practice', answers('budget-practice'), 'p3')
  service.practice('alice', 'budget-challenge', 'reassessment', answers('budget-reassessment', false), 'r3')
  assert.deepEqual(service.getProfile('alice').completedChallenges, [])
})
test('closed loop updates profile through the learner profile service and opens the next learning path', () => {
  const { service, events } = setup()
  initial(service)
  assert.equal(service.recommend('alice').moduleId, 'budget-foundations')
  completeBudget(service)
  const profile = service.getProfile('alice')
  assert.equal(profile.competencies.budgeting.masteryLevel, 'proficient')
  assert.deepEqual(profile.completedModules, ['budget-foundations'])
  assert.equal(service.recommend('alice').moduleId, 'digital-safety-foundations')
  assert.ok(events.some((event) => event.type === 'CompetencyImproved'))
  assert.equal(getLearningUnlockRequirement('coffee_shop', profile), null)
  assert.equal(getLearningUnlockRequirement('building_xl_white', profile), 'Selesaikan Tantangan Keamanan Digital')
})
test('learning and city prerequisites are checked at the service boundary', () => {
  initial()
  assert.throws(() => learningService.readModule('alice', 'digital-safety-foundations'))
  completeBudget()
  learningService.readModule('alice', 'digital-safety-foundations')
  assert.throws(() => learningService.practice('alice', 'safety-challenge', 'practice', answers('safety-practice'), 's1'), /kota level 2/)
  localStorage.setItem(cityStorageKey('after-gamifikasi-economy-state', 'alice'), JSON.stringify({ bankLevel: 2, barberLevel: 1 }))
  assert.equal(learningService.practice('alice', 'safety-challenge', 'practice', answers('safety-practice'), 's2').passed, true)
})
test('completion grants game rewards once, repeated attempts keep learning available', () => {
  initial()
  completeBudget()
  const stats = getUserStats('alice')
  assert.equal(stats.exp, 100)
  assert.equal(stats.coin, 850)
  assert.equal(stats.level, 2)
  learningService.practice('alice', 'budget-challenge', 'reassessment', answers('budget-reassessment'), 'repeated-reassessment')
  assert.deepEqual(getUserStats('alice'), stats)
  assert.equal(learningService.getProfile('alice').practiceResults.length, 3)
  assert.ok(getAchievementSnapshot('alice').achievements.find((item) => item.id === 'learning-bronze').unlocked)
})
test('retrying the same assessment request does not duplicate evidence or rewards', () => {
  initial()
  completeBudget()
  const before = learningService.getProfile('alice')
  const stats = getUserStats('alice')
  learningService.practice('alice', 'budget-challenge', 'reassessment', answers('budget-reassessment'), 'alice-reassessment')
  assert.deepEqual(learningService.getProfile('alice'), before)
  assert.deepEqual(getUserStats('alice'), stats)
})
test('daily question progress deduplicates question IDs and mission claims cannot be repeated', () => {
  initial()
  completeBudget()
  const before = getDailyRewardLog('alice').actionCounts.answerQuestion
  learningService.practice('alice', 'budget-challenge', 'practice', answers('budget-practice'), 'p-again')
  assert.equal(getDailyRewardLog('alice').actionCounts.answerQuestion, before)
  assert.ok(getDailyMissions('alice').every((mission) => mission.completed))
  assert.equal(claimMissionReward('alice', 'learn-questions').success, true)
  const stats = getUserStats('alice')
  assert.equal(claimMissionReward('alice', 'learn-questions').success, false)
  assert.deepEqual(getUserStats('alice'), stats)
  assert.equal(claimMissionReward('bob', 'learn-questions').success, false)
})
test('different users have isolated profiles, rewards, missions and city storage', () => {
  initial()
  completeBudget()
  assert.equal(learningService.getProfile('bob').overallScore, null)
  assert.equal(getUserStats('bob').coin, 0)
  assert.equal(getDailyRewardLog('bob').actionCounts.completeChallenge, 0)
  assert.notEqual(cityStorageKey('city', 'alice'), cityStorageKey('city', 'bob'))
  assert.throws(() => cityStorageKey('city', ''))
})
test('purchase boundary enforces learning unlock and fails closed on unreadable profile', () => {
  const coffee = { key: 'coffee_shop', name: 'Kedai Kopi', type: 'building', price: 20, assetKey: '', imageUrl: '' }
  const locked = purchaseLearningShopItem('alice', coffee)
  assert.equal(locked.success, false)
  assert.match(locked.message, /Tantangan Anggaran/)
  initial()
  completeBudget()
  assert.equal(purchaseLearningShopItem('alice', coffee).success, true)
  localStorage.setItem(learningStorageKey('alice'), 'invalid-json')
  const before = getUserStats('alice').coin
  assert.equal(purchaseLearningShopItem('alice', coffee).success, false)
  assert.equal(getUserStats('alice').coin, before)
})
test('legacy PFM progress and anonymous city balances are not learning evidence', () => {
  localStorage.setItem('after-gamifikasi-economy-state', JSON.stringify({ coins: 9999, diamonds: 999 }))
  localStorage.setItem('after-gamifikasi-finance-alice', JSON.stringify({ transactions: Array(15).fill({}) }))
  localStorage.setItem('achievement_progress_alice', JSON.stringify({ achievements: { 'finance-gold': { unlocked: true } } }))
  assert.equal(getUserStats('alice').coin, 0)
  assert.ok(getDailyMissions('alice').every((mission) => !mission.completed))
  assert.equal(getAchievementSnapshot('alice').unlockedCount, 0)
  assert.equal(learningService.getProfile('alice').overallScore, null)
})
test('persistence refuses malformed or wrong-owner learning profiles without overwriting them', () => {
  const repository = new LocalLearningRepository()
  localStorage.setItem(learningStorageKey('alice'), '{broken')
  assert.throws(() => repository.load('alice'))
  assert.equal(localStorage.getItem(learningStorageKey('alice')), '{broken')
  localStorage.setItem(learningStorageKey('alice'), JSON.stringify(createLearningProfile('bob')))
  assert.throws(() => repository.load('alice'))
})
test('failed profile persistence publishes no learning reward event', () => {
  const { service, events } = setup()
  localStorage.setItem = () => { throw new Error('quota') }
  assert.throws(() => initial(service), /belum tersimpan/)
  assert.deepEqual(events, [])
})
test('completion receipt and balance survive retries and never report storage failure as success', () => {
  localStorage.setItem = () => { throw new Error('quota') }
  assert.throws(() => grantLearningCompletionReward('alice', 'challenge:x', [{ type: 'coin', amount: 25 }]), /belum tersimpan/)
  assert.deepEqual(getUserStats('alice').learningRewardReceipts, [])
})
test('daily event delivery is idempotent', () => {
  recordLearningMissionEvent('alice', 'completeLesson', 'lesson:1')
  recordLearningMissionEvent('alice', 'completeLesson', 'lesson:1')
  assert.equal(getDailyRewardLog('alice').actionCounts.completeLesson, 1)
})
test('competency-specific missions count only matching evidence', () => {
  dailyMissionDefinitions.push({ id: 'budget-only', title: 'Budget fixture', description: '', competencyId: 'budgeting', requirement: { action: 'answerQuestion', target: 1 }, rewards: [] })
  try {
    recordLearningMissionEvent('alice', 'answerQuestion', 'safety:q1', 1, ['digital-safety'])
    assert.equal(getDailyMissions('alice').find((item) => item.id === 'budget-only').completed, false)
    recordLearningMissionEvent('alice', 'answerQuestion', 'budget:q1', 1, ['budgeting'])
    assert.equal(getDailyMissions('alice').find((item) => item.id === 'budget-only').completed, true)
  } finally { dailyMissionDefinitions.pop() }
})
test('curated retrieval excludes pending/rejected sources and never fabricates citations', async () => {
  assert.deepEqual(await new CuratedKnowledgeRepository().retrieve({ competencyIds: ['budgeting'], text: '', limit: 3 }), [])
  const repository = new CuratedKnowledgeRepository(['pending', 'verified', 'rejected'].map((verificationStatus) => ({ id: verificationStatus, title: 'Fixture', organization: 'Test', publishedAt: null, sourceUrl: 'https://example.com/fixture', retrievedAt: at, topics: ['budgeting'], content: 'Fixture only', verificationStatus })))
  const result = await repository.retrieve({ competencyIds: ['budgeting'], text: '', limit: 3 })
  assert.deepEqual(result.map((item) => item.source.id), ['verified'])
})
