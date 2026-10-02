import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { FinancialLiteracyAgent } from '../src/agent/FinancialLiteracyAgent.ts'
import { createLearningToolRegistry } from '../src/agent/learningTools.ts'
import { assessmentService } from '../src/services/assessment/assessmentService.ts'
import { practiceService } from '../src/services/practice/practiceService.ts'
import { learningRecommendationService } from '../src/services/recommendation/learningRecommendationService.ts'
import { createLearnerProfileService } from '../src/services/learnerProfile/learnerProfileService.ts'
import { createLearningService } from '../src/services/learning/learningService.ts'
import { learningService, learningRewardService } from '../src/services/learning/defaultLearningService.ts'
import { LocalLearningRepository, learningStorageKey } from '../src/services/persistence/learningRepository.ts'
import { CuratedKnowledgeRepository } from '../src/services/knowledge/KnowledgeRepository.ts'
import { createKnowledgeRetrievalService } from '../src/services/knowledge/knowledgeRetrievalService.ts'
import { assessments, learningChallenges, learningModules } from '../src/learning/modules/catalog.ts'
import { createLearningProfile } from '../src/learning/progress/profile.ts'
import { cityStorageKey } from '../src/game/city/storage.ts'
import { getStoredCityProgress } from '../src/game/cityProgress.ts'
import { getUserStats } from '../src/gamification/rewards/gamificationService.ts'

beforeEach(() => {
  const values = new Map()
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }
  globalThis.window = Object.assign(new EventTarget(), { setTimeout, clearTimeout })
})

const uid = 'tool-learner'
const answers = (id, correct = true) => assessments.find(a => a.id === id).questions.map(q => ({ questionId: q.id, optionId: correct ? q.correctOptionId : q.options[0].id }))
const submission = (assessmentId, correct = true) => ({ userId: uid, id: `submitted:${assessmentId}`, assessmentId, answers: answers(assessmentId, correct) })
const makeRegistry = (submissions = [], overrides = {}) => createLearningToolRegistry({
  learning: learningService, rewards: learningRewardService,
  knowledge: createKnowledgeRetrievalService(new CuratedKnowledgeRepository()),
  getCityLevel: userId => getStoredCityProgress(userId).cityLevel,
  ...overrides,
}, uid, submissions)
const names = registry => registry.specifications().map(tool => tool.name)
const call = (registry, name, input = {}) => registry.execute(name, input, names(registry))
const runRequest = (registry, overrides = {}) => ({ goal: 'Lanjutkan pembelajaran anggaran.', allowedTools: names(registry), ...overrides })
// Scripted providers exist only in tests; they are not a model or an application feature.
const scripted = (...actions) => ({ decideNextAction: async () => actions.shift() })
const readAction = { type: 'call-tool', tool: 'getLearnerProfile', input: {} }

function completedWithoutDelivery() {
  const repository = new LocalLearningRepository()
  const workflow = createLearningService(repository, { assessment: assessmentService, recommendation: learningRecommendationService, practice: practiceService }, { assessments, challenges: learningChallenges, modules: learningModules }, { getCityLevel: () => 1, onProgress: () => {} })
  workflow.assess(uid, 'initial-v1', answers('initial-v1', false), 'initial')
  workflow.readModule(uid, 'budget-foundations')
  workflow.practice(uid, 'budget-challenge', 'practice', answers('budget-practice'), 'practice')
  workflow.practice(uid, 'budget-challenge', 'reassessment', answers('budget-reassessment'), 'reassessment')
  return { workflow, repository }
}

test('registry exposes real typed capabilities, not arbitrary database or currency writes', () => {
  const registry = makeRegistry()
  const specs = registry.specifications()
  assert.equal(new Set(names(registry)).size, 11)
  for (const tool of specs) {
    assert.ok(tool.description.length > 10)
    assert.equal(tool.inputSchema.additionalProperties, false)
    assert.ok(!('userId' in tool.inputSchema.properties))
    assert.ok(!('amount' in tool.inputSchema.properties))
    assert.ok(!('answers' in tool.inputSchema.properties))
  }
  assert.equal(registry.has('updateCompetencyProfile'), false)
  specs[0].inputSchema.properties.userId = { type: 'string' }
  assert.equal('userId' in registry.specifications()[0].inputSchema.properties, false)
})

test('unknown tools, forbidden tools and invalid inputs cannot execute a reward mutation', async () => {
  const registry = makeRegistry()
  assert.equal((await registry.execute('__proto__', {}, [])).error.code, 'UNKNOWN_TOOL')
  assert.equal((await registry.execute('grantLearningReward', { challengeId: 'budget-challenge' }, ['getLearnerProfile'])).error.code, 'TOOL_NOT_ALLOWED')
  for (const input of [null, [], { challengeId: 1 }, { challengeId: ' ' }, { challengeId: 'budget-challenge', amount: 10000 }, { challengeId: 'budget-challenge', userId: 'other-user' }, {}]) {
    assert.equal((await call(registry, 'grantLearningReward', input)).error.code, 'INVALID_TOOL_INPUT')
  }
  assert.equal((await call(registry, 'startPractice', { challengeId: 'budget-challenge', purpose: 'initial' })).error.code, 'INVALID_TOOL_INPUT')
  assert.equal(getUserStats(uid).exp, 0)
})

test('assessment tool returns questions without keys and scores only a bound learner submission', async () => {
  const registry = makeRegistry([submission('initial-v1', false)])
  const initial = await call(registry, 'startAssessment', { assessmentId: 'initial-v1' })
  assert.equal(initial.ok, true)
  assert.ok(initial.output.questions.every(q => !('correctOptionId' in q) && !('explanation' in q)))
  assert.equal((await call(registry, 'scoreAssessment', { submissionId: 'invented' })).error.code, 'TOOL_FAILED')
  assert.equal((await call(registry, 'scoreAssessment', { submissionId: 'submitted:initial-v1', answers: answers('initial-v1') })).error.code, 'INVALID_TOOL_INPUT')
  const result = await call(registry, 'scoreAssessment', { submissionId: 'submitted:initial-v1' })
  assert.equal(result.output.score, 0)
  assert.equal(learningService.getCompetencyScores(uid).budgeting.score, 0)
  assert.equal(getUserStats(uid).exp, 0)
})

test('submission identity is bound by the application and snapshots cannot be changed by a provider', async () => {
  assert.throws(() => makeRegistry([{ ...submission('initial-v1'), userId: 'other-user' }]))
  assert.throws(() => makeRegistry([submission('initial-v1'), submission('initial-v1')]))
  const value = submission('initial-v1', false)
  const registry = makeRegistry([value])
  value.answers = answers('initial-v1')
  assert.equal((await call(registry, 'scoreAssessment', { submissionId: value.id })).output.score, 0)
})

test('tools preserve the full learning loop and city prerequisites without duplicating rewards', async () => {
  const registry = makeRegistry([submission('initial-v1', false), submission('budget-practice'), submission('budget-reassessment')])
  assert.equal((await call(registry, 'getLearningModule', { moduleId: 'budget-foundations' })).ok, false)
  await call(registry, 'scoreAssessment', { submissionId: 'submitted:initial-v1' })
  assert.equal((await call(registry, 'getLearningRecommendation')).output.moduleId, 'budget-foundations')
  assert.equal((await call(registry, 'getLearningModule', { moduleId: 'budget-foundations' })).output.id, 'budget-foundations')
  await call(registry, 'markModuleRead', { moduleId: 'budget-foundations' })
  assert.equal((await call(registry, 'startPractice', { challengeId: 'budget-challenge', purpose: 'reassessment' })).ok, false)
  assert.equal((await call(registry, 'startPractice', { challengeId: 'budget-challenge', purpose: 'practice' })).output.id, 'budget-practice')
  const practice = { challengeId: 'budget-challenge', purpose: 'practice', submissionId: 'submitted:budget-practice' }
  assert.equal((await call(registry, 'evaluatePractice', practice)).output.passed, true)
  assert.equal(learningService.getProfile(uid).competencies.budgeting.score, 0)
  const reassessment = { ...practice, purpose: 'reassessment', submissionId: 'submitted:budget-reassessment' }
  assert.equal((await call(registry, 'evaluatePractice', reassessment)).output.passed, true)
  assert.equal((await call(registry, 'getLearnerProfile')).output.competencies.budgeting.score, 100)
  assert.equal((await call(registry, 'getLearningRecommendation')).output.moduleId, 'digital-safety-foundations')
  const stats = getUserStats(uid)
  assert.equal(stats.exp, 100)
  assert.equal(stats.coin, 850)
  await call(registry, 'evaluatePractice', reassessment)
  await call(registry, 'grantLearningReward', { challengeId: 'budget-challenge' })
  assert.deepEqual(getUserStats(uid), stats)
  await call(registry, 'markModuleRead', { moduleId: 'digital-safety-foundations' })
  assert.equal((await call(registry, 'startPractice', { challengeId: 'safety-challenge', purpose: 'practice' })).ok, false)
  localStorage.setItem(cityStorageKey('after-gamifikasi-economy-state', uid), JSON.stringify({ bankLevel: 2 }))
  assert.equal((await call(registry, 'startPractice', { challengeId: 'safety-challenge', purpose: 'practice' })).output.id, 'safety-practice')
})

test('profile access uses one repository and does not interpret practice as mastery', () => {
  const { workflow, repository } = completedWithoutDelivery()
  const profiles = createLearnerProfileService(repository, learningModules)
  assert.deepEqual(profiles.getCompetencyScores(uid), workflow.getProfile(uid).competencies)
  assert.deepEqual(profiles.getLearningHistory(uid), workflow.getLearningHistory(uid))
  assert.equal(profiles.getCurrentLearningPath(uid).find(item => item.moduleId === 'digital-safety-foundations').available, true)
  const registry = makeRegistry()
  const snapshot = registry.observeLearner()
  snapshot.competencies.budgeting.score = 0
  assert.equal(profiles.getLearnerProfile(uid).competencies.budgeting.score, 100)
})

test('reward eligibility rejects unknown challenges and completion flags without evidence', () => {
  assert.equal(learningRewardService.checkRewardEligibility(uid, 'unknown').reason, 'unknown-challenge')
  assert.equal(learningRewardService.checkRewardEligibility(uid, 'budget-challenge').reason, 'not-completed')
  const profile = createLearningProfile(uid)
  profile.completedChallenges = ['budget-challenge']
  profile.completedModules = ['budget-foundations']
  new LocalLearningRepository().save(profile)
  assert.equal(learningRewardService.grantLearningReward(uid, 'budget-challenge').eligibility.reason, 'missing-evidence')
  assert.equal(getUserStats(uid).coin, 0)
})

test('reward tool uses configuration, respects capacity and issues one receipt without changing mastery', async () => {
  completedWithoutDelivery()
  const registry = makeRegistry()
  const before = localStorage.getItem(learningStorageKey(uid))
  assert.equal((await call(registry, 'checkRewardEligibility', { challengeId: 'budget-challenge' })).output.eligible, true)
  localStorage.setItem(`after-gamifikasi-user-stats-${uid}`, JSON.stringify({ ...getUserStats(uid), coin: 999, diamond: 999 }))
  assert.equal((await call(registry, 'grantLearningReward', { challengeId: 'budget-challenge' })).output.granted, true)
  assert.equal(getUserStats(uid).coin, 1000)
  assert.equal(getUserStats(uid).diamond, 1000)
  assert.equal(getUserStats(uid).exp, 100)
  assert.equal((await call(registry, 'grantLearningReward', { challengeId: 'budget-challenge' })).output.granted, false)
  assert.equal(localStorage.getItem(learningStorageKey(uid)), before)
})

test('reward grant rechecks eligibility after a previous successful check', () => {
  const { repository } = completedWithoutDelivery()
  assert.equal(learningRewardService.checkRewardEligibility(uid, 'budget-challenge').eligible, true)
  repository.save({ ...repository.load(uid), completedChallenges: [] })
  assert.equal(learningRewardService.grantLearningReward(uid, 'budget-challenge').granted, false)
  assert.equal(getUserStats(uid).exp, 0)
})

test('knowledge tool reports no verified results and never claims working RAG', async () => {
  const result = await call(makeRegistry(), 'retrieveKnowledge', { competencyId: 'budgeting', topic: 'anggaran', difficulty: 'foundation' })
  assert.deepEqual(result.output, { status: 'no-verified-results', mode: 'curated-filter-only', passages: [] })
  const unreviewed = createKnowledgeRetrievalService({ retrieve: async () => [{ source: { verificationStatus: 'pending' }, excerpt: 'unverified', relevance: 1 }] })
  assert.equal((await unreviewed.retrieveKnowledge({ competencyId: 'budgeting', topic: 'test' })).passages.length, 0)
})

test('pre-refactor saved profile, mastery, receipt and currency survive reconciliation', () => {
  const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/pre-single-agent-save.json', import.meta.url), 'utf8'))
  for (const [key, value] of Object.entries(fixture.storage)) localStorage.setItem(key, value)
  const profileBefore = localStorage.getItem(learningStorageKey(fixture.userId))
  const statsBefore = getUserStats(fixture.userId)
  learningService.reconcile(fixture.userId)
  assert.equal(localStorage.getItem(learningStorageKey(fixture.userId)), profileBefore)
  assert.deepEqual(getUserStats(fixture.userId), statsBefore)
  assert.equal(learningService.getProfile(fixture.userId).assessmentResults[0].evaluator, 'rules-demo')
  assert.equal(learningService.recommend(fixture.userId).moduleId, 'digital-safety-foundations')
  learningService.readModule(fixture.userId, 'digital-safety-foundations')
  assert.equal(learningService.getProfile(fixture.userId).schemaVersion, 1)
})

test('single-agent foundation explicitly stops when no provider is configured', async () => {
  const registry = makeRegistry()
  const result = await new FinancialLiteracyAgent(registry).run(runRequest(registry))
  assert.equal(result.status, 'not-configured')
  assert.equal(result.steps, 0)
  assert.deepEqual(result.observations, [])
})

test('single-agent loop observes updated learner state and tool results before the next decision', async () => {
  const registry = makeRegistry([submission('initial-v1', false)])
  let decisions = 0
  const provider = { decideNextAction: async context => {
    decisions++
    if (decisions === 1) {
      assert.equal(context.learner.overallScore, null)
      return { type: 'call-tool', tool: 'scoreAssessment', input: { submissionId: 'submitted:initial-v1' } }
    }
    assert.equal(context.learner.overallScore, 0)
    assert.equal(context.observations[0].result.output.score, 0)
    assert.equal(context.availableTools.length, 1)
    return { type: 'complete', message: 'Asesmen sudah dinilai.' }
  } }
  const result = await new FinancialLiteracyAgent(registry, provider).run(runRequest(registry, { allowedTools: ['scoreAssessment'] }))
  assert.equal(result.status, 'completed')
  assert.equal(result.steps, 2)
  assert.equal(getUserStats(uid).exp, 0)
})

test('maximum steps stops repeated actions without scheduling another decision', async () => {
  const registry = makeRegistry()
  let count = 0
  const result = await new FinancialLiteracyAgent(registry, { decideNextAction: async () => { count++; return readAction } }).run(runRequest(registry, { maxSteps: 2 }))
  assert.equal(result.status, 'step-limit')
  assert.equal(result.observations.length, 2)
  assert.equal(count, 2)
})

test('invalid provider decisions, tool names, input and allowlists fail closed', async () => {
  const registry = makeRegistry()
  for (const [action, code] of [
    [null, 'INVALID_DECISION'],
    [{ type: 'complete', message: 'done', reasoning: 'Do not accept hidden reasoning fields' }, 'INVALID_DECISION'],
    [{ type: 'call-tool', tool: 'writeDatabase', input: {} }, 'UNKNOWN_TOOL'],
    [{ type: 'call-tool', tool: 'getLearnerProfile', input: { userId: 'another' } }, 'INVALID_TOOL_INPUT'],
    [{ type: 'call-tool', tool: 'grantLearningReward', input: { challengeId: 'budget-challenge' } }, 'TOOL_NOT_ALLOWED'],
  ]) {
    const result = await new FinancialLiteracyAgent(registry, scripted(action)).run(runRequest(registry, { allowedTools: ['getLearnerProfile'] }))
    assert.equal(result.status, 'failed')
    assert.equal(result.error.code, code)
  }
})

test('agent can pause for learner input without scoring or awarding anything', async () => {
  const registry = makeRegistry()
  const result = await new FinancialLiteracyAgent(registry, scripted({ type: 'await-input', message: 'Silakan isi asesmen.' })).run(runRequest(registry))
  assert.equal(result.status, 'awaiting-input')
  assert.equal(learningService.getProfile(uid).assessmentResults.length, 0)
})

test('provider failures are bounded and do not expose raw provider errors', async () => {
  const registry = makeRegistry()
  const provider = { decideNextAction: async () => { throw new Error('sensitive-provider-debug') } }
  const result = await new FinancialLiteracyAgent(registry, provider).run(runRequest(registry))
  assert.equal(result.error.code, 'PROVIDER_FAILED')
  assert.ok(!JSON.stringify(result).includes('sensitive-provider-debug'))
})

test('timeouts and cancellation terminate a stalled decision and prevent tool execution', async () => {
  const registry = makeRegistry()
  let signal
  const stalled = { decideNextAction: async (_, current) => { signal = current; return new Promise(() => {}) } }
  const result = await new FinancialLiteracyAgent(registry, stalled).run(runRequest(registry, { stepTimeoutMs: 15 }))
  assert.equal(result.error.code, 'TIMED_OUT')
  assert.equal(signal.aborted, true)
  const controller = new AbortController()
  controller.abort()
  assert.equal((await new FinancialLiteracyAgent(registry, stalled).run(runRequest(registry, { signal: controller.signal }))).status, 'cancelled')
  assert.equal((await registry.execute('markModuleRead', { moduleId: 'budget-foundations' }, names(registry), controller.signal)).error.code, 'CANCELLED')
})

test('concurrent runs are rejected and cancellation prevents a late decision from mutating state', async () => {
  const registry = makeRegistry()
  let resolve
  const provider = { decideNextAction: () => new Promise(done => { resolve = done }) }
  const agent = new FinancialLiteracyAgent(registry, provider)
  const controller = new AbortController()
  const running = agent.run(runRequest(registry, { signal: controller.signal }))
  await Promise.resolve()
  assert.equal((await agent.run(runRequest(registry))).error.code, 'RUN_IN_PROGRESS')
  controller.abort()
  assert.equal((await running).status, 'cancelled')
  resolve({ type: 'call-tool', tool: 'grantLearningReward', input: { challengeId: 'budget-challenge' } })
  await Promise.resolve()
  assert.equal(getUserStats(uid).exp, 0)
})

test('invalid run limits cannot disable the step or timeout protection', async () => {
  const registry = makeRegistry()
  for (const options of [{ maxSteps: 0 }, { maxSteps: 21 }, { maxSteps: Infinity }, { stepTimeoutMs: 0 }, { stepTimeoutMs: 30001 }, { allowedTools: ['unknown'] }, { goal: '' }]) {
    const result = await new FinancialLiteracyAgent(registry, scripted(readAction)).run(runRequest(registry, options))
    assert.equal(result.error.code, 'INVALID_RUN')
    assert.equal(result.steps, 0)
  }
})
