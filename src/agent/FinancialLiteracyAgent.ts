import type { AgentModelProvider } from './provider.ts'
import { AgentToolRegistry, isRecord } from './toolRegistry.ts'
import type { AgentState, ToolName } from './types.ts'

export type AgentRunRequest = {
  goal: string
  allowedTools: readonly ToolName[]
  maxSteps?: number
  stepTimeoutMs?: number
  signal?: AbortSignal
}

class ExecutionError extends Error {
  readonly code: string
  constructor(code: string, message: string) { super(message); this.code = code }
}

async function bounded<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number, external?: AbortSignal): Promise<T> {
  if (external?.aborted) throw new ExecutionError('CANCELLED', 'Tugas dibatalkan.')
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  let onAbort: (() => void) | undefined
  const deadline = new Promise<never>((_, reject) => {
    onAbort = () => { controller.abort(); reject(new ExecutionError('CANCELLED', 'Tugas dibatalkan.')) }
    external?.addEventListener('abort', onAbort, { once: true })
    timer = setTimeout(() => {
      controller.abort()
      reject(new ExecutionError('TIMED_OUT', 'Batas waktu langkah tercapai.'))
    }, timeoutMs)
  })
  try { return await Promise.race([Promise.resolve().then(() => operation(controller.signal)), deadline]) }
  finally {
    clearTimeout(timer)
    if (onAbort) external?.removeEventListener('abort', onAbort)
  }
}

function parseDecision(value: unknown) {
  if (!isRecord(value)) throw new ExecutionError('INVALID_DECISION', 'Keputusan provider harus terstruktur.')
  if (value.type === 'complete' || value.type === 'await-input') {
    if (Object.keys(value).some((key) => !['type', 'message'].includes(key)) || typeof value.message !== 'string' || !value.message.trim() || value.message.length > 1000) throw new ExecutionError('INVALID_DECISION', 'Keputusan akhir tidak valid.')
    return { type: value.type, message: value.message } as const
  }
  if (value.type === 'call-tool' && typeof value.tool === 'string' && Object.hasOwn(value, 'input') && !Object.keys(value).some((key) => !['type', 'tool', 'input'].includes(key))) {
    return { type: 'call-tool', tool: value.tool, input: value.input } as const
  }
  throw new ExecutionError('INVALID_DECISION', 'Jenis keputusan tidak diizinkan.')
}

// Single, opt-in orchestration foundation. There is intentionally no default model.
// State/observations are returned in memory; no autonomous work or reasoning logs.
export class FinancialLiteracyAgent {
  private readonly registry: AgentToolRegistry
  private readonly provider?: AgentModelProvider
  private running = false

  constructor(registry: AgentToolRegistry, provider?: AgentModelProvider) {
    this.registry = registry
    this.provider = provider
  }

  async run(request: AgentRunRequest): Promise<AgentState> {
    const state: AgentState = { goal: request.goal, status: 'running', steps: 0, learner: null, observations: [] }
    const fail = (code: string, message: string): AgentState => ({ ...state, status: code === 'CANCELLED' ? 'cancelled' : 'failed', error: { code, message } })
    if (this.running) return fail('RUN_IN_PROGRESS', 'Satu tugas masih berjalan.')
    const maxSteps = request.maxSteps ?? 8
    const timeout = request.stepTimeoutMs ?? 5000
    if (typeof request.goal !== 'string' || !request.goal.trim() || request.goal.length > 1000 || !Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 20 || !Number.isFinite(timeout) || timeout < 1 || timeout > 30000 || !Array.isArray(request.allowedTools) || request.allowedTools.some((name) => !this.registry.has(name))) {
      return fail('INVALID_RUN', 'Goal, allowlist, atau batas eksekusi tidak valid.')
    }
    if (request.signal?.aborted) return fail('CANCELLED', 'Tugas dibatalkan.')
    if (!this.provider) return { ...state, status: 'not-configured', message: 'Provider model belum diimplementasikan. Gunakan alur belajar deterministik yang tersedia.' }
    const allowedTools = [...new Set(request.allowedTools)]
    const specifications = this.registry.specifications().filter((tool) => allowedTools.includes(tool.name))
    this.running = true
    let phase = 'OBSERVATION'
    try {
      state.learner = this.registry.observeLearner()
      while (state.steps < maxSteps) {
        if (request.signal?.aborted) return fail('CANCELLED', 'Tugas dibatalkan.')
        state.steps++
        phase = 'PROVIDER'
        const context = structuredClone({ goal: state.goal, learner: state.learner, step: state.steps, availableTools: specifications, observations: state.observations })
        const decision = parseDecision(await bounded((signal) => this.provider!.decideNextAction(context, signal), timeout, request.signal))
        if (request.signal?.aborted) return fail('CANCELLED', 'Tugas dibatalkan.')
        if (decision.type !== 'call-tool') {
          return { ...state, status: decision.type === 'complete' ? 'completed' : 'awaiting-input', message: decision.message }
        }
        if (!this.registry.has(decision.tool)) return fail('UNKNOWN_TOOL', 'Provider memilih tool yang tidak terdaftar.')
        phase = 'TOOL'
        const tool = decision.tool
        const result = await bounded((signal) => this.registry.execute(tool, decision.input, allowedTools, signal), timeout, request.signal)
        state.observations.push({ step: state.steps, tool, result })
        if (!result.ok) return fail(result.error.code, result.error.message)
        phase = 'OBSERVATION'
        state.learner = this.registry.observeLearner()
      }
      return { ...state, status: 'step-limit', message: 'Batas langkah tercapai. Tidak ada tindakan lanjutan yang dijadwalkan.' }
    } catch (cause) {
      return cause instanceof ExecutionError ? fail(cause.code, cause.message) : fail(`${phase}_FAILED`, 'Tugas berhenti karena layanan tidak dapat menyelesaikan langkah.')
    } finally { this.running = false }
  }
}
