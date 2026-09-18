"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScientificRetriever = void 0;
const embeddings_1 = require("./embeddings");
const vectorStore_1 = require("./vectorStore");
class ScientificRetriever {
    embeddingService = new embeddings_1.LocalSemanticEmbeddingService();
    /**
     * Constructs an optimized semantic query from current accumulated environmental state
     * adhering strictly to Section 9 of Agents.md
     */
    buildRetrievalQuery(state, userQuery) {
        const queryParts = [];
        if (state.region)
            queryParts.push(state.region);
        if (state.climate.region && state.climate.region !== state.region)
            queryParts.push(state.climate.region);
        if (state.land_use.crop)
            queryParts.push(state.land_use.crop);
        if (state.land_use.cropping_system)
            queryParts.push(state.land_use.cropping_system);
        if (state.climate.rainfall) {
            queryParts.push(typeof state.climate.rainfall === 'string' ? `${state.climate.rainfall} rainfall` : `${state.climate.rainfall}mm rainfall`);
        }
        if (state.soil.organic_carbon_percent !== undefined) {
            queryParts.push(`soil organic carbon ${state.soil.organic_carbon_percent}%`);
        }
        if (state.soil.moisture_percent !== undefined) {
            queryParts.push(`soil moisture ${state.soil.moisture_percent}%`);
        }
        if (state.human_impact.pesticide_intensity) {
            queryParts.push(`${state.human_impact.pesticide_intensity} pesticide intensity`);
        }
        // Include core ecological targets
        queryParts.push('biodiversity', 'habitat diversity', 'soil carbon accrual', 'intercropping', 'cover crops', 'restoration evidence');
        if (userQuery) {
            queryParts.push(userQuery);
        }
        return queryParts.join(' ');
    }
    /**
     * Performs semantic retrieval against scientific document chunks
     */
    async retrieveEvidence(state, userQuery, topK = 3, filter) {
        const queryString = this.buildRetrievalQuery(state, userQuery);
        const queryVector = await this.embeddingService.embedQuery(queryString);
        const searchResults = vectorStore_1.globalVectorStore.search(queryVector, topK, filter);
        return searchResults.map(res => ({
            id: res.record.id,
            title: res.record.metadata.title,
            source: res.record.metadata.source,
            url: res.record.metadata.source_url,
            publication_year: res.record.metadata.publication_year,
            excerpt: res.record.text,
            relevance: Math.round(res.similarity * 100) / 100,
            variables_addressed: res.record.metadata.environmental_variables
        }));
    }
}
exports.ScientificRetriever = ScientificRetriever;
