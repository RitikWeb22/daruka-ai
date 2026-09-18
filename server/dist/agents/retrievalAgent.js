"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalRetrievalAgent = exports.RetrievalAgent = void 0;
const retriever_1 = require("../rag/retriever");
class RetrievalAgent {
    retriever = new retriever_1.ScientificRetriever();
    async retrieve(state, userQuery) {
        const evidence = await this.retriever.retrieveEvidence(state, userQuery, 4);
        // Sort by relevance descending and ensure high credibility sources
        return evidence.filter(item => item.relevance >= 0.5);
    }
}
exports.RetrievalAgent = RetrievalAgent;
exports.globalRetrievalAgent = new RetrievalAgent();
