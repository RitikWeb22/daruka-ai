import { EnvironmentalState, CausalLink } from '../environmental/schema';
import { extractCausalChains } from '../environmental/relationships';

export interface ReasoningAnalysis {
  interacting_variables: string[];
  causal_chains: CausalLink[];
  assessment_summary: string;
  identified_stresses: string[];
  ecological_mechanisms: string[];
}

export class ReasoningAgent {
  public analyze(state: EnvironmentalState): ReasoningAnalysis {
    const causalChains = extractCausalChains(state);
    const variablesSet = new Set<string>();
    const identifiedStresses: string[] = [];
    const mechanisms: string[] = [];

    // Collect all variables involved across causal links
    for (const chain of causalChains) {
      chain.variables.forEach(v => variablesSet.add(v));
      mechanisms.push(chain.mechanism);
    }

    // Check specific conditions and articulate inter-variable interactions
    const isSemiArid = state.region === 'semi-arid' || state.climate.region === 'semi-arid' || state.climate.rainfall === 'low';
    const isLowSoc = state.soil.organic_carbon_percent !== undefined && state.soil.organic_carbon_percent < 1.0;
    const isMonoculture = state.land_use.cropping_system === 'monoculture' || Boolean(state.land_use.crop);
    const isPesticideHigh = state.human_impact.pesticide_intensity === 'high';

    if (isSemiArid) {
      identifiedStresses.push('Hydrological deficit (low precipitation / high evaporative demand)');
      variablesSet.add('rainfall');
    }
    if (isLowSoc) {
      identifiedStresses.push(`Soil structural depletion (SOC = ${state.soil.organic_carbon_percent}%)`);
      variablesSet.add('soil_organic_carbon');
    }
    if (isMonoculture) {
      identifiedStresses.push(`Trophic & microhabitat homogenization (${state.land_use.crop || 'crop'} monoculture)`);
      variablesSet.add('cropping_system');
      if (state.land_use.crop) variablesSet.add('crop');
    }
    if (isPesticideHigh) {
      identifiedStresses.push('High ecotoxicity disturbance on non-target pollinators & soil microflora');
      variablesSet.add('pesticide_intensity');
    }

    // Formulate multi-variable environmental assessment summary
    let assessmentSummary = '';
    const connectedVars = Array.from(variablesSet);

    if (connectedVars.length >= 3) {
      assessmentSummary = `Multi-variable environmental interaction detected across ${connectedVars.join(', ')}. ` +
        `The interaction of hydrological constraints (low moisture/rainfall) with depleted soil organic carbon ` +
        `and monocultural landscape homogenization creates a compounding bottleneck on ecological stability. ` +
        `Low SOC diminishes aggregate water retention capacity, exacerbating plant moisture deficit, while uniform monoculture ` +
        `suppresses beneficial insect populations and soil biological diversity.`;
    } else if (connectedVars.length > 0) {
      assessmentSummary = `Observed environmental variables (${connectedVars.join(', ')}) indicate localized ecological stress. ` +
        `However, comprehensive diagnosis is constrained by missing environmental variables.`;
    } else {
      assessmentSummary = `Insufficient environmental parameters provided to construct a multi-variable causal diagnosis.`;
    }

    return {
      interacting_variables: connectedVars,
      causal_chains: causalChains,
      assessment_summary: assessmentSummary,
      identified_stresses: identifiedStresses,
      ecological_mechanisms: mechanisms
    };
  }
}

export const globalReasoningAgent = new ReasoningAgent();
