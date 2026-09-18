import { cosineSimilarity } from './embeddings';

export interface DocumentMetadata {
  doc_id: string;
  chunk_id: string;
  title: string;
  source: string;
  source_url: string;
  publication_year: number;
  document_type: string;
  topic: string[];
  environmental_variables: string[];
  region: string;
  credibility: 'high' | 'moderate' | 'low';
}

export interface VectorRecord {
  id: string;
  text: string;
  vector: number[];
  metadata: DocumentMetadata;
}

export interface SearchResult {
  record: VectorRecord;
  similarity: number;
}

export interface MetadataFilter {
  topics?: string[];
  variables?: string[];
  sources?: string[];
  region?: string;
  minCredibility?: string;
}

export class VectorStore {
  private records: VectorRecord[] = [];

  public addRecord(record: VectorRecord): void {
    this.records.push(record);
  }

  public addRecords(records: VectorRecord[]): void {
    this.records.push(...records);
  }

  public count(): number {
    return this.records.length;
  }

  public clear(): void {
    this.records = [];
  }

  public search(queryVector: number[], topK = 4, filter?: MetadataFilter): SearchResult[] {
    let candidates = this.records;

    // Apply metadata filtering if specified
    if (filter) {
      candidates = candidates.filter(r => {
        if (filter.variables && filter.variables.length > 0) {
          const hasVar = filter.variables.some(v => r.metadata.environmental_variables.includes(v));
          if (!hasVar) return false;
        }
        if (filter.sources && filter.sources.length > 0) {
          if (!filter.sources.includes(r.metadata.source)) return false;
        }
        if (filter.topics && filter.topics.length > 0) {
          const hasTopic = filter.topics.some(t => r.metadata.topic.includes(t));
          if (!hasTopic) return false;
        }
        return true;
      });
    }

    const scored = candidates.map(record => ({
      record,
      similarity: cosineSimilarity(queryVector, record.vector)
    }));

    // Sort descending by similarity score
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, topK);
  }

  public getAllRecords(): VectorRecord[] {
    return this.records;
  }
}

// Global Singleton Instance
export const globalVectorStore = new VectorStore();
