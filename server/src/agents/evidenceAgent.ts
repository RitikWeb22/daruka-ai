import { ScientificEvidenceItem, RecommendationItem } from '../environmental/schema';

export interface VerificationResult {
  isValid: boolean;
  claimsVerified: number;
  warnings: string[];
  sanitizedRecommendations: RecommendationItem[];
}

export class EvidenceAgent {
  /**
   * Enforces Guardrails & Numerical Claim Policy (Sections 14, 15, 28)
   */
  public verify(
    recommendations: RecommendationItem[],
    retrievedEvidence: ScientificEvidenceItem[],
    userQuery?: string
  ): VerificationResult {
    const warnings: string[] = [];
    const validEvidenceIds = new Set(retrievedEvidence.map(e => e.id));
    const isDemandingPrecision = userQuery && /(?:exact|precise|percentage|how much %|what %)/i.test(userQuery);

    const sanitized = recommendations.map(rec => {
      // 1. Ensure all attached citations exist in retrieved evidence
      const verifiedEvidence = rec.evidence.filter(ev => {
        if (ev.id && !validEvidenceIds.has(ev.id)) {
          warnings.push(`Filtered ungrounded citation: ${ev.title}`);
          return false;
        }
        return true;
      });

      // 2. Scan text for arbitrary ungrounded percentages
      const hasArbitraryNumber = /(\d+)\s*%/g.test(rec.recommendation + ' ' + rec.reasoning);
      if (hasArbitraryNumber) {
        // Verify if retrieved evidence text explicitly contains that exact figure
        const fullEvidenceText = retrievedEvidence.map(e => e.excerpt).join(' ');
        const matches = (rec.reasoning.match(/(\d+)\s*%/g) || []);
        for (const match of matches) {
          if (!fullEvidenceText.includes(match)) {
            warnings.push(`Flagged ungrounded numerical claim (${match}) not found in primary literature.`);
            // Append explicit disclaimer adhering to Section 14
            rec.caveats_and_uncertainty += ` [Scientific Policy Alert: The quantitative estimate ${match} is an illustrative benchmark and cannot be transferred without localized empirical measurement.]`;
          }
        }
      }

      // 3. Handle specific precision demands without empirical evidence
      if (isDemandingPrecision) {
        rec.caveats_and_uncertainty += ` The available peer-reviewed scientific evidence establishes the positive direction of this intervention, but empirical ecological science does not support providing an arbitrary percentage estimate for your unique field conditions without site-specific baseline monitoring.`;
      }

      return {
        ...rec,
        evidence: verifiedEvidence
      };
    });

    return {
      isValid: warnings.length === 0,
      claimsVerified: sanitized.length,
      warnings,
      sanitizedRecommendations: sanitized
    };
  }
}

export const globalEvidenceAgent = new EvidenceAgent();
