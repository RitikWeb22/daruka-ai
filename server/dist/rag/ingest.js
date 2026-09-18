"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestScientificDocuments = ingestScientificDocuments;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const embeddings_1 = require("./embeddings");
const vectorStore_1 = require("./vectorStore");
async function ingestScientificDocuments(filePath) {
    const resolvedPath = filePath || path_1.default.join(__dirname, '../../data/documents/scientific_corpus.json');
    if (!fs_1.default.existsSync(resolvedPath)) {
        throw new Error(`Scientific corpus not found at: ${resolvedPath}`);
    }
    const rawData = fs_1.default.readFileSync(resolvedPath, 'utf-8');
    const documents = JSON.parse(rawData);
    const embeddingService = new embeddings_1.LocalSemanticEmbeddingService();
    const recordsToInsert = [];
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
    vectorStore_1.globalVectorStore.clear();
    vectorStore_1.globalVectorStore.addRecords(recordsToInsert);
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
