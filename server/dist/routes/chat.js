"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inputAgent_1 = require("../agents/inputAgent");
const environmentalState_1 = require("../memory/environmentalState");
const conversationMemory_1 = require("../memory/conversationMemory");
const validators_1 = require("../environmental/validators");
const retrievalAgent_1 = require("../agents/retrievalAgent");
const reasoningAgent_1 = require("../agents/reasoningAgent");
const recommendationAgent_1 = require("../agents/recommendationAgent");
const evidenceAgent_1 = require("../agents/evidenceAgent");
const responseAgent_1 = require("../agents/responseAgent");
const llmService_1 = require("../services/llmService");
const reasoning_1 = require("../prompts/reasoning");
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        const { message, sessionId = 'default-session', reset = false } = req.body;
        if (!message && !reset) {
            res.status(400).json({ error: 'Message input or reset instruction is required.' });
            return;
        }
        if (reset) {
            environmentalState_1.globalStateManager.resetState(sessionId);
            conversationMemory_1.globalConversationMemory.clearSession(sessionId);
            res.json({ message: 'Session reset successfully', sessionId });
            return;
        }
        // Step 1: Input Agent (parse text or JSON, extract variables, check ambiguities)
        const normalizedInput = inputAgent_1.globalInputAgent.processInput(message);
        const userPromptText = normalizedInput.rawText;
        // Step 2: Environmental State Manager (Accumulate structured facts across turns)
        const currentState = environmentalState_1.globalStateManager.updateState(sessionId, normalizedInput.extractedState);
        conversationMemory_1.globalConversationMemory.addTurn(sessionId, 'user', userPromptText);
        // Step 3: Completeness & Clarifying Questions Engine
        const completeness = (0, validators_1.calculateCompleteness)(currentState, 0.45);
        const isClarificationNeeded = !completeness.is_sufficient;
        // Step 4: Knowledge Retrieval Agent (Semantic search with metadata filtering)
        // Always retrieve evidence so advice is grounded even for broad inquiries
        const evidence = await retrievalAgent_1.globalRetrievalAgent.retrieve(currentState, userPromptText);
        // Step 5: Multi-Metric Reasoning Agent (Causal graphs, >= 3 variables connected)
        const analysis = reasoningAgent_1.globalReasoningAgent.analyze(currentState);
        // Step 6: Recommendation Agent (Action, Why, Directional metrics, Time horizon, Evidence)
        const rawRecommendations = recommendationAgent_1.globalRecommendationAgent.generateRecommendations(currentState, analysis, evidence, userPromptText);
        // Step 7: Evidence Verification Agent & Numerical Claim Guardrails
        const verification = evidenceAgent_1.globalEvidenceAgent.verify(rawRecommendations, evidence, userPromptText);
        // Step 8: Optional LLM Synthesis (if Gemini or Mistral keys are active)
        let llmCustomSynthesis;
        if (process.env.GEMINI_API_KEY || process.env.MISTRAL_API_KEY) {
            try {
                const sysPrompt = (0, reasoning_1.buildSystemReasoningPrompt)();
                const usrPrompt = (0, reasoning_1.buildUserReasoningPrompt)({
                    userQuestion: userPromptText,
                    environmentalState: currentState,
                    missingVariables: completeness.missing_critical_variables,
                    evidence,
                    causalChains: analysis.causal_chains
                });
                const llmResult = await llmService_1.globalLLMService.generateText({
                    systemPrompt: sysPrompt,
                    userPrompt: usrPrompt
                });
                if (llmResult.text && llmResult.text.trim().length > 20) {
                    llmCustomSynthesis = llmResult.text;
                }
            }
            catch (err) {
                console.warn(`[Chat Route] LLM enrichment bypassed: ${err.message}`);
            }
        }
        // Step 9: Assemble Final Structured API Response
        const finalResponse = responseAgent_1.globalResponseAgent.assembleResponse({
            state: currentState,
            completeness,
            causalChains: analysis.causal_chains,
            recommendations: verification.sanitizedRecommendations,
            evidence,
            llmCustomText: llmCustomSynthesis,
            isClarificationNeeded
        });
        conversationMemory_1.globalConversationMemory.addTurn(sessionId, 'assistant', finalResponse.answer);
        res.json(finalResponse);
    }
    catch (error) {
        console.error('[Chat API Error]', error);
        res.status(500).json({
            error: 'Environmental Intelligence Engine encountered an unexpected error.',
            details: error.message
        });
    }
});
router.get('/history/:sessionId', (req, res) => {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const turns = conversationMemory_1.globalConversationMemory.getRecentTurns(sessionId, 50);
    res.json({ sessionId, turns });
});
router.post('/reset', (req, res) => {
    const { sessionId = 'default-session' } = req.body;
    environmentalState_1.globalStateManager.resetState(sessionId);
    conversationMemory_1.globalConversationMemory.clearSession(sessionId);
    res.json({ message: 'Session reset successfully', sessionId });
});
exports.default = router;
