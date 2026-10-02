export type LearningModule = {
  id: string
  version: number
  title: string
  competencyIds: string[]
  objectives: string[]
  sections: { title: string; content: string }[]
  prerequisiteModuleIds: string[]
  sourceIds: string[]
  contentStatus: 'demo' | 'reviewed'
}
