import type { AgentAction, AgentDecisionContext } from './types.ts'

// Future implementation belongs on a backend with authenticated tool adapters.
// No provider SDK, network call, secret, or fabricated model reasoning exists here.
export interface AgentModelProvider {
  decideNextAction(context: AgentDecisionContext, signal: AbortSignal): Promise<AgentAction>
}
