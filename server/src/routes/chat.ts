import { Router, Request, Response } from 'express';
import { globalInputAgent } from '../agents/inputAgent';
import { globalStateManager } from '../memory/environmentalState';
import { globalConversationMemory } from '../memory/conversationMemory';
import { calculateCompleteness } from '../environmental/validators';
import { globalRetrievalAgent } from '../agents/retrievalAgent';
import { globalReasoningAgent } from '../agents/reasoningAgent';
import { globalRecommendationAgent } from '../agents/recommendationAgent';
import { globalEvidenceAgent } from '../agents/evidenceAgent';
import { globalResponseAgent } from '../agents/responseAgent';
import { globalLLMService } from '../services/llmService';
import { buildSystemReasoningPrompt, buildUserReasoningPrompt } from '../prompts/reasoning';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, sessionId = 'default-session', reset = false } = req.body;

    if (!message && !reset) {
      res.status(400).json({ error: 'Message input or reset instruction is required.' });
      return;
    }

    if (reset) {
      globalStateManager.resetState(sessionId);
      globalConversationMemory.clearSession(sessionId);
      res.json({ message: 'Session reset successfully', sessionId });
      return;
    }

    // Step 1: Input Agent (parse text or JSON, extract variables, check ambiguities)
    const normalizedInput = globalInputAgent.processInput(message);
    const userPromptText = normalizedInput.rawText;

    // Step 2: Environmental State Manager (Accumulate structured facts across turns)
    const currentState = globalStateManager.updateState(sessionId, normalizedInput.extractedState);
    globalConversationMemory.addTurn(sessionId, 'user', userPromptText);

    // Step 3: Completeness & Clarifying Questions Engine
    const completeness = calculateCompleteness(currentState, 0.45);
    const isClarificationNeeded = !completeness.is_sufficient;

    // Step 4: Knowledge Retrieval Agent (Semantic search with metadata filtering)
    // Always retrieve evidence so advice is grounded even for broad inquiries
    const evidence = await globalRetrievalAgent.retrieve(currentState, userPromptText);

    // Step 5: Multi-Metric Reasoning Agent (Causal graphs, >= 3 variables connected)
    const analysis = globalReasoningAgent.analyze(currentState);

    // Step 6: Recommendation Agent (Action, Why, Directional metrics, Time horizon, Evidence)
    const rawRecommendations = globalRecommendationAgent.generateRecommendations(
      currentState,
      analysis,
      evidence,
      userPromptText
    );

    // Step 7: Evidence Verification Agent & Numerical Claim Guardrails
    const verification = globalEvidenceAgent.verify(rawRecommendations, evidence, userPromptText);

    // Step 8: Optional LLM Synthesis (if Gemini or Mistral keys are active)
    let llmCustomSynthesis: string | undefined;
    if (process.env.GEMINI_API_KEY || process.env.MISTRAL_API_KEY) {
      try {
        const sysPrompt = buildSystemReasoningPrompt();
        const usrPrompt = buildUserReasoningPrompt({
          userQuestion: userPromptText,
          environmentalState: currentState,
          missingVariables: completeness.missing_critical_variables,
          evidence,
          causalChains: analysis.causal_chains
        });
        const llmResult = await globalLLMService.generateText({
          systemPrompt: sysPrompt,
          userPrompt: usrPrompt
        });
        if (llmResult.text && llmResult.text.trim().length > 20) {
          llmCustomSynthesis = llmResult.text;
        }
      } catch (err: any) {
        console.warn(`[Chat Route] LLM enrichment bypassed: ${err.message}`);
      }
    }

    // Step 9: Assemble Final Structured API Response
    const finalResponse = globalResponseAgent.assembleResponse({
      state: currentState,
      completeness,
      causalChains: analysis.causal_chains,
      recommendations: verification.sanitizedRecommendations,
      evidence,
      llmCustomText: llmCustomSynthesis,
      isClarificationNeeded
    });

    globalConversationMemory.addTurn(sessionId, 'assistant', finalResponse.answer);
    res.json(finalResponse);
  } catch (error: any) {
    console.error('[Chat API Error]', error);
    res.status(500).json({
      error: 'Environmental Intelligence Engine encountered an unexpected error.',
      details: error.message
    });
  }
});

router.get('/history/:sessionId', (req: Request, res: Response) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const turns = globalConversationMemory.getRecentTurns(sessionId, 50);
  res.json({ sessionId, turns });
});

router.post('/reset', (req: Request, res: Response) => {
  const { sessionId = 'default-session' } = req.body;
  globalStateManager.resetState(sessionId);
  globalConversationMemory.clearSession(sessionId);
  res.json({ message: 'Session reset successfully', sessionId });
});

export default router;
