import { Router, Request, Response } from 'express';
import { globalStateManager } from '../memory/environmentalState';
import { calculateCompleteness, parseTextForEnvironmentalState } from '../environmental/validators';
import { extractCausalChains } from '../environmental/relationships';
import { globalVectorStore } from '../rag/vectorStore';
import { globalRetrievalAgent } from '../agents/retrievalAgent';

const router = Router();

router.get('/state/:sessionId', (req: Request, res: Response) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const state = globalStateManager.getState(sessionId);
  const completeness = calculateCompleteness(state);
  const causalChains = extractCausalChains(state);

  res.json({
    sessionId,
    state,
    completeness,
    causalChains
  });
});

router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const input = req.body;
    let state = input.state;

    if (!state && input.text) {
      const extracted = parseTextForEnvironmentalState(input.text);
      state = {
        soil: extracted.soil || {},
        land_use: extracted.land_use || {},
        climate: extracted.climate || {},
        biodiversity: extracted.biodiversity || {},
        human_impact: extracted.human_impact || {},
        region: extracted.region
      };
    }

    const completeness = calculateCompleteness(state || {});
    const causalChains = extractCausalChains(state || {});
    const evidence = await globalRetrievalAgent.retrieve(state || {}, input.text);

    res.json({
      state,
      completeness,
      causalChains,
      evidence
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Demo 4: Endpoint to inspect indexed scientific sources
router.get('/corpus', (_req: Request, res: Response) => {
  const records = globalVectorStore.getAllRecords();
  const uniqueDocs = new Map<string, any>();

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

export default router;
