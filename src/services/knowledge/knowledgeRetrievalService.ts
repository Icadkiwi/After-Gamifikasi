import type { KnowledgeRepository, RetrievedPassage } from './KnowledgeRepository.ts'

export type KnowledgeQuery = { competencyId: string; topic: string; difficulty?: 'foundation' | 'developing' | 'proficient' }
export type KnowledgeRetrievalResult = {
  status: 'no-verified-results' | 'verified-results'
  mode: 'curated-filter-only'
  passages: RetrievedPassage[]
}
export interface KnowledgeRetrievalService {
  retrieveKnowledge(query: KnowledgeQuery): Promise<KnowledgeRetrievalResult>
}

// Foundation: local metadata filtering only. No semantic RAG or model is connected.
export function createKnowledgeRetrievalService(repository: KnowledgeRepository): KnowledgeRetrievalService {
  return {
    async retrieveKnowledge(query) {
      if (!query.competencyId.trim() || !query.topic.trim()) throw new Error('Kompetensi dan topik diperlukan.')
      const retrieved = await repository.retrieve({ competencyIds: [query.competencyId], text: query.topic, limit: 3 })
      const passages = retrieved.filter((item) => item.source.verificationStatus === 'verified')
      // Difficulty is reserved metadata; the current repository does not rank by it.
      return { status: passages.length ? 'verified-results' : 'no-verified-results', mode: 'curated-filter-only', passages }
    },
  }
}
