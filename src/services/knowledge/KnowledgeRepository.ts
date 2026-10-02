export type KnowledgeSource = {
  id: string
  title: string
  organization: string
  author?: string
  publishedAt: string | null
  sourceUrl: string
  retrievedAt: string
  topics: string[]
  content: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verifiedBy?: string
}

export type RetrievedPassage = { source: KnowledgeSource; excerpt: string; relevance: number }
export interface KnowledgeRepository {
  retrieve(query: { competencyIds: string[]; text: string; limit: number }): Promise<RetrievedPassage[]>
}

// An empty curated store never invents a citation or performs open-web retrieval.
export class CuratedKnowledgeRepository implements KnowledgeRepository {
  private readonly sources: KnowledgeSource[]
  constructor(sources: KnowledgeSource[] = []) { this.sources = sources }
  async retrieve({ competencyIds, limit }: { competencyIds: string[]; text: string; limit: number }) {
    return this.sources.filter((source) => source.verificationStatus === 'verified' && source.topics.some((topic) => competencyIds.includes(topic)))
      .slice(0, Math.max(0, limit)).map((source) => ({ source, excerpt: source.content, relevance: 1 }))
  }
}
