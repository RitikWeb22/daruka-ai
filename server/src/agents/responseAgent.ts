import { 
  StructuredResponse, 
  EnvironmentalState, 
  RecommendationItem, 
  ScientificEvidenceItem, 
  CausalLink 
} from '../environmental/schema';
import { CompletenessResult } from '../environmental/validators';

export class ResponseAgent {
  public assembleResponse(params: {
    state: EnvironmentalState;
    completeness: CompletenessResult;
    causalChains: CausalLink[];
    recommendations: RecommendationItem[];
    evidence: ScientificEvidenceItem[];
    llmCustomText?: string;
    isClarificationNeeded: boolean;
  }): StructuredResponse {
    const { 
      state, 
      completeness, 
      causalChains, 
      recommendations, 
      evidence, 
      llmCustomText,
      isClarificationNeeded 
    } = params;

    let md = '';

    if (isClarificationNeeded) {
      md += `## Environmental Assessment

Based on global ecological frameworks (FAO, UNEP, IPBES), terrestrial biodiversity on agricultural land is strongly governed by soil organic matter, vegetative cover continuity, and microhabitat complexity.

Currently, your site-specific environmental data completeness score is **${Math.round(completeness.score * 100)}%**.
To formulate an exact diagnosis calibrated to your local soil hydrology and crop dynamics, please clarify the key variables below. In the interim, authoritative scientific literature provides the following foundational interventions:\n\n`;

      if (recommendations.length > 0) {
        md += `## Foundational Ecological Interventions\n\n`;
        recommendations.forEach((rec, idx) => {
          md += `### ${idx + 1}. 🌱 ${rec.recommendation}\n\n`;
          md += `#### Why\n${rec.reasoning}\n\n`;
          md += `#### Environmental Metrics\n`;
          rec.metrics.forEach(m => {
            const arrow = m.direction.includes('increase') ? '↑ increase' : m.direction.includes('decrease') ? '↓ decrease' : '↔ stabilize';
            md += `• **${m.name.replace(/_/g, ' ')}** → ${arrow}${m.expected_mechanism ? ` *(${m.expected_mechanism})*` : ''}\n`;
          });
          md += `\n#### Time Horizon\n${rec.time_horizon_detail || rec.time_horizon}\n\n`;
          md += `#### Evidence Grounding\n`;
          if (rec.evidence.length > 0) {
            rec.evidence.forEach(ev => {
              md += `• **${ev.source}** (${ev.publication_year || 'N/A'}): *${ev.title}* — [Source Document](${ev.url})\n`;
            });
          }
          md += `\n#### Important Uncertainty\n${rec.caveats_and_uncertainty}\n\n`;
        });
      }

      return {
        answer: md,
        environmental_assessment: 'Preliminary diagnosis. Site-specific calibration requires missing parameters.',
        completeness: {
          score: completeness.score,
          available_variables: completeness.available_variables,
          missing_critical_variables: completeness.missing_critical_variables,
          is_sufficient: false
        },
        environmental_state: state,
        reasoning_graph: causalChains,
        recommendations: recommendations,
        missing_information: completeness.missing_critical_variables,
        sources: evidence,
        clarifying_questions: completeness.suggested_clarifications
      };
    }

    // High completeness response
    const assessmentSummary = llmCustomText || (
      `Your current environmental conditions indicate that biodiversity is constrained by the multi-variable interaction between ` +
      `water availability, depleted soil organic carbon (${state.soil.organic_carbon_percent !== undefined ? state.soil.organic_carbon_percent + '%' : 'low'}), ` +
      `and landscape homogenization under ${state.land_use.crop || 'crop'} ${state.land_use.cropping_system || 'monoculture'}.`
    );

    md = `## Environmental Assessment\n\n${assessmentSummary}\n\n`;

    if (recommendations.length > 0) {
      md += `## Recommended Interventions\n\n`;
      recommendations.forEach((rec, idx) => {
        md += `### ${idx + 1}. 🌱 ${rec.recommendation}\n\n`;
        md += `#### Why\n${rec.reasoning}\n\n`;
        md += `#### Environmental Metrics\n`;
        rec.metrics.forEach(m => {
          const arrow = m.direction.includes('increase') ? '↑ increase' : m.direction.includes('decrease') ? '↓ decrease' : '↔ stabilize';
          md += `• **${m.name.replace(/_/g, ' ')}** → ${arrow}${m.expected_mechanism ? ` *(${m.expected_mechanism})*` : ''}\n`;
        });
        md += `\n#### Time Horizon\n${rec.time_horizon_detail || rec.time_horizon}\n\n`;
        md += `#### Evidence Grounding\n`;
        if (rec.evidence.length > 0) {
          rec.evidence.forEach(ev => {
            md += `• **${ev.source}** (${ev.publication_year || 'N/A'}): *${ev.title}* — [Source Document](${ev.url})\n`;
          });
        }
        md += `\n#### Confidence\n**${typeof rec.confidence === 'number' ? `${Math.round(rec.confidence * 100)}%` : rec.confidence}** (High empirical consensus across dryland trials)\n\n`;
        md += `#### Important Uncertainty\n${rec.caveats_and_uncertainty}\n\n`;
      });
    }

    return {
      answer: md,
      environmental_assessment: assessmentSummary,
      completeness: {
        score: completeness.score,
        available_variables: completeness.available_variables,
        missing_critical_variables: completeness.missing_critical_variables,
        is_sufficient: true
      },
      environmental_state: state,
      reasoning_graph: causalChains,
      recommendations: recommendations,
      missing_information: completeness.missing_critical_variables,
      sources: evidence
    };
  }
}

export const globalResponseAgent = new ResponseAgent();
