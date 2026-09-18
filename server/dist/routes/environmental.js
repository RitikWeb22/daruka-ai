"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const environmentalState_1 = require("../memory/environmentalState");
const validators_1 = require("../environmental/validators");
const relationships_1 = require("../environmental/relationships");
const vectorStore_1 = require("../rag/vectorStore");
const retrievalAgent_1 = require("../agents/retrievalAgent");
const router = (0, express_1.Router)();
router.get('/state/:sessionId', (req, res) => {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const state = environmentalState_1.globalStateManager.getState(sessionId);
    const completeness = (0, validators_1.calculateCompleteness)(state);
    const causalChains = (0, relationships_1.extractCausalChains)(state);
    res.json({
        sessionId,
        state,
        completeness,
        causalChains
    });
});
router.post('/evaluate', async (req, res) => {
    try {
        const input = req.body;
        let state = input.state;
        if (!state && input.text) {
            const extracted = (0, validators_1.parseTextForEnvironmentalState)(input.text);
            state = {
                soil: extracted.soil || {},
                land_use: extracted.land_use || {},
                climate: extracted.climate || {},
                biodiversity: extracted.biodiversity || {},
                human_impact: extracted.human_impact || {},
                region: extracted.region
            };
        }
        const completeness = (0, validators_1.calculateCompleteness)(state || {});
        const causalChains = (0, relationships_1.extractCausalChains)(state || {});
        const evidence = await retrievalAgent_1.globalRetrievalAgent.retrieve(state || {}, input.text);
        res.json({
            state,
            completeness,
            causalChains,
            evidence
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Demo 4: Endpoint to inspect indexed scientific sources
router.get('/corpus', (_req, res) => {
    const records = vectorStore_1.globalVectorStore.getAllRecords();
    const uniqueDocs = new Map();
    records.forEach(r => {
        if (!uniqueDocs.has(r.metadata.doc_id)) {
            uniqueDocs.set(r.metadata.doc_id, {
                id: r.metadata.doc_id,
                title: r.metadata.title,
                source: r.metadata.source,
                source_url: r.metadata.source_url,
                publication_year: r.metadata.publication_year,
                document_type: r.metadata.document_type,
                topic: r.metadata.topic,
                region: r.metadata.region,
                credibility: r.metadata.credibility,
                chunkCount: 0,
                chunks: []
            });
        }
        const doc = uniqueDocs.get(r.metadata.doc_id);
        doc.chunkCount++;
        doc.chunks.push({
            chunk_id: r.metadata.chunk_id,
            text: r.text,
            variables: r.metadata.environmental_variables
        });
    });
    res.json({
        totalChunks: records.length,
        documents: Array.from(uniqueDocs.values())
    });
});
exports.default = router;
