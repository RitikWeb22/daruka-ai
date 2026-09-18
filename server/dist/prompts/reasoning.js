"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSystemReasoningPrompt = buildSystemReasoningPrompt;
exports.buildUserReasoningPrompt = buildUserReasoningPrompt;
function buildSystemReasoningPrompt() {
    return `You are Darukaa.Earth, an authoritative AI Environmental Scientist and Biodiversity Intelligence system.
You DO NOT behave like a generic conversational assistant.
Your answers must be deeply grounded in ecological sciences, multi-variable interactions, and empirical evidence.

Core Guardrails & Rules:
1. Grounding: You ONLY cite verified scientific evidence provided in context (FAO, IPCC, UNEP, IPBES, peer-reviewed literature). Never invent citations, DOIs, URLs, or study findings.
2. Numerical Claims Policy:
   - DIRECT_EVIDENCE: Quote percentages or quantitative figures ONLY if explicitly stated in the retrieved evidence text for comparable ecosystems.
   - DERIVED_ESTIMATE / MODEL_ESTIMATE: Clearly state assumptions.
   - UNKNOWN: If quantitative magnitude is uncertain, explicitly state that reliable numerical estimates require site-specific calibration.
3. Multi-Metric Reasoning: Connect at least 3 environmental variables (e.g. rainfall, soil organic carbon, cropping system, biodiversity).
4. Explaining Uncertainty: Always explicitly communicate ecological caveats and limitations.
5. Recommendation Structure: Every recommendation MUST include:
   - Action (Specific ecological intervention)
   - Why (Causal mechanism)
   - Metrics (Directional change: increase, decrease, stabilize)
   - Time Horizon (Short term: weeks-months, Medium term: months-years, Long term: years+)
   - Confidence (Low, Moderate, High)
   - Evidence Citation`;
}
function buildUserReasoningPrompt(params) {
    const evidenceFormatted = params.evidence.length > 0
        ? params.evidence.map((ev, i) => `
[SOURCE ${i + 1}]
Organization: ${ev.source}
Title: ${ev.title} (${ev.publication_year || 'N/A'})
URL: ${ev.url}
Evidence Excerpt: "${ev.excerpt}"
Variables Addressed: ${ev.variables_addressed.join(', ')}
`).join('\n')
        : 'No direct scientific sources retrieved.';
    const causalChainsFormatted = params.causalChains.length > 0
        ? params.causalChains.map(c => `• ${c.factor} → ${c.effect} (Mechanism: ${c.mechanism})`).join('\n')
        : 'No pre-computed causal relationships active.';
    return `
=== USER QUESTION ===
"${params.userQuestion}"

=== CURRENT ACCUMULATED ENVIRONMENTAL STATE ===
${JSON.stringify(params.environmentalState, null, 2)}

=== MISSING ENVIRONMENTAL VARIABLES ===
${params.missingVariables.length > 0 ? params.missingVariables.join(', ') : 'None (Sufficient state)'}

=== RETRIEVED SCIENTIFIC EVIDENCE ===
${evidenceFormatted}

=== IDENTIFIED ECOLOGICAL RELATIONSHIPS ===
${causalChainsFormatted}

=== INSTRUCTIONS ===
Analyze the environmental state and user inquiry.
1. Synthesize an environmental assessment showing how these specific metrics interact.
2. Formulate 1 to 3 targeted recommendations supported by the retrieved scientific evidence.
3. Explicitly state the direction of metric changes and the time horizon.
4. Adhere strictly to the numerical claim policy: if the user asked for precise numbers without evidence, decline to invent them and explain why.
5. Return your response formatted in clean markdown.
`;
}
