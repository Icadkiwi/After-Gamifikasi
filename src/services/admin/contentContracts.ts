import type { AssessmentDefinition } from '../../learning/assessment/types.ts'
import type { FinancialCompetency } from '../../learning/competencies/competencies.ts'
import type { LearningModule } from '../../learning/modules/types.ts'
import type { LearningChallenge } from '../../learning/challenges/types.ts'
import type { LearningMissionDefinition } from '../../gamification/missions/missionConfig.ts'
import type { AchievementDefinition } from '../../gamification/achievements/achievementConfig'
import type { GameReward } from '../../gamification/rewards/types.ts'
import type { KnowledgeSource } from '../knowledge/KnowledgeRepository.ts'

export type EducationalContent =
  | { kind: 'module'; value: LearningModule }
  | { kind: 'competency'; value: FinancialCompetency }
  | { kind: 'quiz'; value: AssessmentDefinition }
  | { kind: 'challenge'; value: LearningChallenge }
  | { kind: 'mission'; value: LearningMissionDefinition }
  | { kind: 'achievement'; value: AchievementDefinition }
  | { kind: 'reward'; value: { id: string; rewards: GameReward[] } }
  | { kind: 'knowledge'; value: KnowledgeSource }

// Future server adapter MUST verify Firebase admin claims, validate and audit writes.
export interface AdminContentService {
  saveDraft(content: EducationalContent): Promise<{ revision: string }>
  publish(id: string, revision: string): Promise<void>
}
