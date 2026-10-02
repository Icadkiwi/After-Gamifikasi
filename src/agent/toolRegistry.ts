import type { AgentToolResult, AgentToolSpecification, LearnerContext, ToolInputs, ToolInputSchema, ToolName, ToolOutputs } from './types.ts'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
}

function validateInput(input: unknown, schema: ToolInputSchema) {
  if (!isRecord(input)) throw new Error('Input tool harus berupa object.')
  if (Object.keys(input).some((key) => !Object.hasOwn(schema.properties, key))) throw new Error('Input tool memuat properti yang tidak diizinkan.')
  for (const key of schema.required) if (!Object.hasOwn(input, key)) throw new Error(`Input ${key} diperlukan.`)
  for (const [key, value] of Object.entries(input)) {
    const rule = schema.properties[key]
    if (typeof value !== 'string' || !value.trim() || value !== value.trim() || value.length > (rule.maxLength ?? 160)) throw new Error(`Input ${key} tidak valid.`)
    if (rule.enum && !rule.enum.includes(value)) throw new Error(`Pilihan ${key} tidak valid.`)
  }
}

type RegisteredTool = { spec: AgentToolSpecification; invoke(input: unknown): Promise<unknown> }

export class AgentToolRegistry {
  private readonly tools = new Map<ToolName, RegisteredTool>()
  private readonly observe: () => LearnerContext

  constructor(observe: () => LearnerContext) { this.observe = observe }

  register<N extends ToolName>(spec: AgentToolSpecification & { name: N }, execute: (input: ToolInputs[N]) => ToolOutputs[N] | Promise<ToolOutputs[N]>) {
    if (this.tools.has(spec.name)) throw new Error(`Tool ${spec.name} sudah terdaftar.`)
    const savedSpec = structuredClone(spec)
    this.tools.set(spec.name, {
      spec: savedSpec,
      invoke: async (input) => {
        validateInput(input, savedSpec.inputSchema)
        // Runtime schema validated above; the registration pairs each name with its I/O types.
        return execute(structuredClone(input) as ToolInputs[N])
      },
    })
  }

  has(name: string): name is ToolName { return this.tools.has(name as ToolName) }
  specifications() { return structuredClone([...this.tools.values()].map((tool) => tool.spec)) }
  observeLearner() { return structuredClone(this.observe()) }

  async execute<N extends ToolName>(name: N, input: unknown, allowlist: readonly ToolName[], signal?: AbortSignal): Promise<AgentToolResult<N>> {
    if (signal?.aborted) return { ok: false, error: { code: 'CANCELLED', message: 'Eksekusi dibatalkan.' } }
    const tool = this.tools.get(name)
    if (!tool) return { ok: false, error: { code: 'UNKNOWN_TOOL', message: 'Tool tidak terdaftar.' } }
    if (!allowlist.includes(name)) return { ok: false, error: { code: 'TOOL_NOT_ALLOWED', message: 'Tool tidak diizinkan untuk tugas ini.' } }
    try { validateInput(input, tool.spec.inputSchema) }
    catch { return { ok: false, error: { code: 'INVALID_TOOL_INPUT', message: 'Input tool tidak sesuai schema.' } } }
    try {
      const output = await tool.invoke(input)
      if (signal?.aborted) return { ok: false, error: { code: 'CANCELLED', message: 'Eksekusi dibatalkan.' } }
      return { ok: true, tool: name, output: structuredClone(output) as ToolOutputs[N] }
    } catch {
      return { ok: false, error: { code: 'TOOL_FAILED', message: 'Tool gagal; periksa prasyarat, submission, atau penyimpanan.' } }
    }
  }
}
