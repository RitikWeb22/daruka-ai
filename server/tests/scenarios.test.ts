import { describe, it, expect, beforeAll } from 'vitest';
import { ingestScientificDocuments } from '../src/rag/ingest';
import { globalInputAgent } from '../src/agents/inputAgent';
import { globalStateManager } from '../src/memory/environmentalState';
import { calculateCompleteness } from '../src/environmental/validators';
import { globalRetrievalAgent } from '../src/agents/retrievalAgent';
import { globalReasoningAgent } from '../src/agents/reasoningAgent';
import { globalRecommendationAgent } from '../src/agents/recommendationAgent';
import { globalEvidenceAgent } from '../src/agents/evidenceAgent';
import { globalResponseAgent } from '../src/agents/responseAgent';

beforeAll(async () => {
  await ingestScientificDocuments();
});

describe('Darukaa.Earth — AI Biodiversity Intelligence Suite', () => {

  // Test 1 — Missing Data (Agents.md §39 Test 1)
  it('Scenario 1: Detects missing critical data and asks clarifying questions', async () => {
    const sessionId = 'test-session-missing-data';
    globalStateManager.resetState(sessionId);

    const input = globalInputAgent.processInput('Biodiversity is declining on my land.');
    const state = globalStateManager.updateState(sessionId, input.extractedState);
    const completeness = calculateCompleteness(state, 0.45);

    expect(completeness.is_sufficient).toBe(false);
    expect(completeness.missing_critical_variables.length).toBeGreaterThan(2);
    expect(completeness.suggested_clarifications.length).toBeGreaterThan(0);

    const response = globalResponseAgent.assembleResponse({
      state,
      completeness,
      causalChains: [],
      recommendations: [],
      evidence: [],
      isClarificationNeeded: true
    });

    expect(response.clarifying_questions).toBeDefined();
    expect(response.clarifying_questions!.length).toBeGreaterThan(0);
    expect(response.answer).toContain('completeness score');
    expect(response.recommendations).toHaveLength(0);
  });

  // Test 2 — Multi-Metric Reasoning (Agents.md §39 Test 2)
  it('Scenario 2: Reasons across at least 3 environmental variables for low rainfall + low SOC + monoculture', async () => {
    const sessionId = 'test-session-multi-metric';
    globalStateManager.resetState(sessionId);

    const input = globalInputAgent.processInput({
      region: 'semi-arid',
      climate: { rainfall: 'low' },
      soil: { organic_carbon_percent: 0.3 },
      land_use: { crop: 'wheat', cropping_system: 'monoculture' }
    });

    const state = globalStateManager.updateState(sessionId, input.extractedState);
    const completeness = calculateCompleteness(state, 0.45);
    expect(completeness.is_sufficient).toBe(true);

    const evidence = await globalRetrievalAgent.retrieve(state);
    const analysis = globalReasoningAgent.analyze(state);

    // Mandated: Reason across at least 3 variables!
    expect(analysis.interacting_variables.length).toBeGreaterThanOrEqual(3);
    expect(analysis.causal_chains.length).toBeGreaterThanOrEqual(2);
    expect(analysis.assessment_summary).toContain('Multi-variable');
  });

  // Test 3 — Scientific Evidence Grounding (Agents.md §39 Test 3)
  it('Scenario 3: Recommendations are grounded in authoritative scientific sources (FAO/IPCC/UNEP/IPBES)', async () => {
    const sessionId = 'test-session-evidence';
    globalStateManager.resetState(sessionId);

    const input = globalInputAgent.processInput({
      region: 'semi-arid',
      rainfall: 'low',
      soil_organic_carbon: 0.3,
      crop: 'wheat',
      land_use: 'monoculture'
    });

    const state = globalStateManager.updateState(sessionId, input.extractedState);
    const evidence = await globalRetrievalAgent.retrieve(state);
    expect(evidence.length).toBeGreaterThan(0);

    const analysis = globalReasoningAgent.analyze(state);
    const rawRecs = globalRecommendationAgent.generateRecommendations(state, analysis, evidence);
    const verified = globalEvidenceAgent.verify(rawRecs, evidence);

    expect(verified.sanitizedRecommendations.length).toBeGreaterThan(0);
    const firstRec = verified.sanitizedRecommendations[0];

    // Must include the 4 mandatory components
    expect(firstRec.recommendation).toBeDefined();
    expect(firstRec.reasoning).toBeDefined();
    expect(firstRec.metrics.length).toBeGreaterThan(0);
    expect(firstRec.evidence.length).toBeGreaterThan(0);
    expect(firstRec.time_horizon).toBeDefined();
    expect(['FAO', 'IPBES', 'IPCC', 'UNEP', 'Agronomy for Sustainable Development / Peer-Reviewed']).toContain(firstRec.evidence[0].source);
  });

  // Test 4 — Unsupported Numerical Claim Policy (Agents.md §39 Test 4)
  it('Scenario 4: Explains uncertainty and refuses to invent ungrounded precise percentages', async () => {
    const sessionId = 'test-session-unsupported-claim';
    globalStateManager.resetState(sessionId);

    const query = 'Tell me the exact percentage increase in biodiversity if I plant clover.';
    const input = globalInputAgent.processInput({
      text: query,
      region: 'semi-arid',
      soil: { organic_carbon_percent: 0.3 }
    });

    const state = globalStateManager.updateState(sessionId, input.extractedState);
    const evidence = await globalRetrievalAgent.retrieve(state);
    const analysis = globalReasoningAgent.analyze(state);
    const rawRecs = globalRecommendationAgent.generateRecommendations(state, analysis, evidence, query);
    const verified = globalEvidenceAgent.verify(rawRecs, evidence, query);

    expect(verified.sanitizedRecommendations[0].caveats_and_uncertainty).toContain('empirical ecological science does not support providing an arbitrary percentage estimate');
  });

  // Test 5 — Multi-Turn State Accumulation (Agents.md §39 Test 5)
  it('Scenario 5: Multi-turn conversational memory accumulates facts across 3 turns', async () => {
    const sessionId = 'test-session-multi-turn';
    globalStateManager.resetState(sessionId);

    // Turn 1: "My land is semi-arid."
    const input1 = globalInputAgent.processInput('My land is semi-arid.');
    const state1 = globalStateManager.updateState(sessionId, input1.extractedState);
    expect(state1.region).toBe('semi-arid');

    // Turn 2: "I grow wheat."
    const input2 = globalInputAgent.processInput('I grow wheat.');
    const state2 = globalStateManager.updateState(sessionId, input2.extractedState);
    expect(state2.region).toBe('semi-arid');
    expect(state2.land_use.crop).toBe('wheat');

    // Turn 3: "SOC is 0.3%."
    const input3 = globalInputAgent.processInput('SOC is 0.3%.');
    const state3 = globalStateManager.updateState(sessionId, input3.extractedState);
    expect(state3.region).toBe('semi-arid');
    expect(state3.land_use.crop).toBe('wheat');
    expect(state3.soil.organic_carbon_percent).toBe(0.3);

    // Multi-variable analysis utilizes all 3 accumulated facts
    const analysis = globalReasoningAgent.analyze(state3);
    expect(analysis.interacting_variables).toContain('soil_organic_carbon');
    expect(analysis.interacting_variables).toContain('crop');
  });

  // Test 6 — Follow-up Constraint Adaptation (Agents.md §47 Demo 3)
  it('Scenario 6: Adapts recommendation when user states constraint "cannot change wheat crop"', async () => {
    const sessionId = 'test-session-constraint';
    globalStateManager.resetState(sessionId);

    const state = globalStateManager.updateState(sessionId, {
      region: 'semi-arid',
      climate: { rainfall: 'low' },
      soil: { organic_carbon_percent: 0.3 },
      land_use: { crop: 'wheat', cropping_system: 'monoculture' }
    });

    const evidence = await globalRetrievalAgent.retrieve(state);
    const analysis = globalReasoningAgent.analyze(state);
    const recs = globalRecommendationAgent.generateRecommendations(
      state,
      analysis,
      evidence,
      'What if I cannot change the wheat crop?'
    );

    expect(recs.some(r => r.recommendation.includes('Strip Intercropping') || r.recommendation.includes('Stubble Mulch'))).toBe(true);
    expect(recs[0].reasoning).toContain('wheat');
  });
});
