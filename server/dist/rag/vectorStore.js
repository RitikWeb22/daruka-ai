"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalVectorStore = exports.VectorStore = void 0;
const embeddings_1 = require("./embeddings");
class VectorStore {
    records = [];
    addRecord(record) {
        this.records.push(record);
    }
    addRecords(records) {
        this.records.push(...records);
    }
    count() {
        return this.records.length;
    }
    clear() {
        this.records = [];
    }
    search(queryVector, topK = 4, filter) {
        let candidates = this.records;
        // Apply metadata filtering if specified
        if (filter) {
            candidates = candidates.filter(r => {
                if (filter.variables && filter.variables.length > 0) {
                    const hasVar = filter.variables.some(v => r.metadata.environmental_variables.includes(v));
                    if (!hasVar)
                        return false;
                }
                if (filter.sources && filter.sources.length > 0) {
                    if (!filter.sources.includes(r.metadata.source))
                        return false;
                }
                if (filter.topics && filter.topics.length > 0) {
                    const hasTopic = filter.topics.some(t => r.metadata.topic.includes(t));
                    if (!hasTopic)
                        return false;
                }
                return true;
            });
        }
        const scored = candidates.map(record => ({
            record,
            similarity: (0, embeddings_1.cosineSimilarity)(queryVector, record.vector)
        }));
        // Sort descending by similarity score
        scored.sort((a, b) => b.similarity - a.similarity);
        return scored.slice(0, topK);
    }
    getAllRecords() {
        return this.records;
    }
}
exports.VectorStore = VectorStore;
// Global Singleton Instance
exports.globalVectorStore = new VectorStore();
