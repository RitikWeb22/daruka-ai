import fs from 'fs';
import path from 'path';
import { LocalSemanticEmbeddingService } from './embeddings';
import { globalVectorStore, VectorRecord } from './vectorStore';

export interface CorpusChunk {
  chunk_id: string;
  text: string;
  variables: string[];
  interventions: string[];
}

export interface CorpusDocument {
  id: string;
  title: string;
  source: string;
  source_url: string;
  publication_year: number;
  document_type: string;
  topic: string[];
  environmental_variables: string[];
  region: string;
  credibility: 'high' | 'moderate' | 'low';
  abstract?: string;
  chunks: CorpusChunk[];
}

export async function ingestScientificDocuments(filePath?: string): Promise<number> {
  const resolvedPath = filePath || path.join(__dirname, '../../data/documents/scientific_corpus.json');
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Scientific corpus not found at: ${resolvedPath}`);
  }

  const rawData = fs.readFileSync(resolvedPath, 'utf-8');
  const documents: CorpusDocument[] = JSON.parse(rawData);

  const embeddingService = new LocalSemanticEmbeddingService();
  const recordsToInsert: VectorRecord[] = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      // Combine title, abstract context, and chunk text for dense semantic representation
      const indexingText = `${doc.title}. ${chunk.text} Key variables: ${chunk.variables.join(', ')}`;
      const vector = await embeddingService.embedQuery(indexingText);

      recordsToInsert.push({
        id: chunk.chunk_id,
        text: chunk.text,
        vector,
        metadata: {
          doc_id: doc.id,
          chunk_id: chunk.chunk_id,
          title: doc.title,
          source: doc.source,
          source_url: doc.source_url,
          publication_year: doc.publication_year,
          document_type: doc.document_type,
          topic: doc.topic,
          environmental_variables: chunk.variables,
          region: doc.region,
          credibility: doc.credibility
        }
      });
    }
  }

  globalVectorStore.clear();
  globalVectorStore.addRecords(recordsToInsert);
  console.log(`[RAG Ingestion] Successfully indexed ${recordsToInsert.length} scientific chunks from ${documents.length} authoritative documents into VectorStore.`);
  return recordsToInsert.length;
}

// Standalone execution script
if (require.main === module) {
  ingestScientificDocuments().then(count => {
    console.log(`Ingested ${count} chunks.`);
    process.exit(0);
  }).catch(err => {
    console.error('Ingestion failed:', err);
    process.exit(1);
  });
}
