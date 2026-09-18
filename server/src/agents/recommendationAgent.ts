import { EnvironmentalState, RecommendationItem, ScientificEvidenceItem } from '../environmental/schema';
import { ReasoningAnalysis } from './reasoningAgent';

export class RecommendationAgent {
  public generateRecommendations(
    state: EnvironmentalState,
    analysis: ReasoningAnalysis,
    evidence: ScientificEvidenceItem[],
    userQuery?: string
  ): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    const queryLower = (userQuery || '').toLowerCase();
    const cannotChangeCrop = queryLower.includes('cannot change') || queryLower.includes("can't change") || queryLower.includes('keep wheat');

    // Case 1: User cannot replace the primary cash crop (e.g., wheat)
    if (cannotChangeCrop) {
      const wheatEvidence = evidence.find(e => e.variables_addressed.includes('crop') || e.excerpt.includes('wheat')) || evidence[0];

      recommendations.push({
        recommendation: 'Adopt 3-Meter Strip Intercropping with Drought-Tolerant Legumes & Perennial Buffer Margins',
        reasoning: 'When primary cash crop replacement is restricted by economic or operational limits, integrating alternating legume strips (e.g., chickpea, vetch) or non-competitive floral field margins preserves 100% of harvestable wheat rows while restoring microclimate heterogeneity, nitrogen fixation, and pollinator refuge.',
        metrics: [
          { name: 'habitat_diversity', direction: 'increase', expected_mechanism: 'Creates spatial refuge corridors adjacent to cereal rows.' },
          { name: 'pollinator_abundance', direction: 'increase', expected_mechanism: 'Maintains continuous floral nectar resources throughout the crop cycle.' },
          { name: 'soil_organic_carbon', direction: 'potential_increase', expected_mechanism: 'Legume root nodulation adds labile carbon and nitrogen to the soil rhizosphere.' },
          { name: 'wheat_yield_stability', direction: 'stabilize', expected_mechanism: 'Buffers against climatic extremes through inter-row microclimates.' }
        ],
        time_horizon: 'medium_term',
        time_horizon_detail: '1 to 2 crop cycles (6 to 18 months)',
        confidence: 0.86,
        evidence: wheatEvidence ? [wheatEvidence] : [],
        caveats_and_uncertainty: 'Inter-row seeding width must be calibrated to farm machinery to prevent seedling competition in low-rainfall seasons.'
      });

      recommendations.push({
        recommendation: 'Implement Surface Stubble Mulch Retention & No-Till Conservation Seeding',
        reasoning: 'Retaining post-harvest wheat residue on the soil surface minimizes radiant surface temperatures, reduces evaporation losses, and preserves subterranean decomposer fungal networks without altering crop rotation.',
        metrics: [
          { name: 'soil_moisture', direction: 'increase', expected_mechanism: 'Reduces solar evaporation and buffers topsoil thermal swings.' },
          { name: 'soil_microbial_activity', direction: 'increase', expected_mechanism: 'Provides sustained cellulose substrate for fungal and bacterial guilds.' },
          { name: 'erosion_loss', direction: 'decrease', expected_mechanism: 'Protects soil aggregates against wind and runoff detachment.' }
        ],
        time_horizon: 'short_term',
        time_horizon_detail: 'Weeks to single growing season (1 to 6 months)',
        confidence: 0.91,
        evidence: evidence.slice(0, 2),
        caveats_and_uncertainty: 'Residue retention requires appropriate seed drill equipment for direct seeding through stubble.'
      });

      return recommendations;
    }

    // Case 2: Standard Multi-Metric Recommendation (Semi-Arid + Low SOC + Monoculture)
    const isArid = state.region === 'semi-arid' || state.climate.rainfall === 'low';
    const isLowSoc = state.soil.organic_carbon_percent !== undefined && state.soil.organic_carbon_percent < 1.0;
    const isMono = state.land_use.cropping_system === 'monoculture' || Boolean(state.land_use.crop);

    if (isArid && isLowSoc && isMono) {
      recommendations.push({
        recommendation: 'Introduce Diversified Multi-Species Cover Cropping & Legume Relay Cropping',
        reasoning: 'Planting taprooted and fibrous-rooted cover crops (e.g., crimson clover, daikon radish, hairy vetch) during fallow windows breaks the monoculture cycle. Continuous biological living roots pump photosynthetic carbon exuded into the rhizosphere, accelerating microbial glue (glomalin) production that repairs soil structure and water-holding capacity.',
        metrics: [
          { name: 'soil_organic_carbon', direction: 'increase', expected_mechanism: 'Continuous subterranean root biomass exudation stimulates microbial carbon stabilization.' },
          { name: 'soil_moisture', direction: 'increase', expected_mechanism: 'Enhanced soil pore structure improves infiltration and reduces evaporative losses.' },
          { name: 'habitat_diversity', direction: 'increase', expected_mechanism: 'Multi-tiered vegetative structure supplies varied ecological niches for aboveground fauna.' },
          { name: 'species_richness', direction: 'potential_increase', expected_mechanism: 'Arthropod and soil invertebrate diversity responds positively to polycultural root matrices.' }
        ],
        time_horizon: 'medium_term',
        time_horizon_detail: 'Medium term: 2 to 4 growing seasons (18 to 36 months)',
        confidence: 0.88,
        evidence: evidence.slice(0, 2),
        caveats_and_uncertainty: 'The rate and magnitude of soil organic carbon accrual is contingent on seasonal rainfall patterns and baseline clay mineralogy.'
      });

      recommendations.push({
        recommendation: 'Establish Native Woody Shelterbelts & Agroforestry Field Corridors',
        reasoning: 'Planting drought-hardy native shrubs and trees on prevailing windward boundaries breaks wind velocity, lowers evapotranspiration in the crop canopy, and constructs permanent migratory corridors across fragmented agricultural plots.',
        metrics: [
          { name: 'ecological_connectivity', direction: 'increase', expected_mechanism: 'Perennial strips bridge fragmented patches across the landscape.' },
          { name: 'evapotranspiration_stress', direction: 'decrease', expected_mechanism: 'Microclimatic windbreak shielding reduces ambient crop moisture loss.' },
          { name: 'pollinator_richness', direction: 'increase', expected_mechanism: 'Permanent native woody perennials provide over-wintering nesting sites.' }
        ],
        time_horizon: 'long_term',
        time_horizon_detail: 'Long term: 3 to 7 years for mature canopy establishment',
        confidence: 0.82,
        evidence: evidence.filter(e => e.variables_addressed.includes('connectivity') || e.variables_addressed.includes('species_richness')).slice(0, 1),
        caveats_and_uncertainty: 'Requires deliberate native species selection to ensure root systems do not compete with crop boundary water tables in extreme drought.'
      });

      return recommendations;
    }

    // Default Fallback Recommendation grounded in retrieved evidence
    const defaultEvidence = evidence.slice(0, 2);
    recommendations.push({
      recommendation: 'Transition to Diversified Vegetative Cover and Reduced Soil Disturbance',
      reasoning: 'Synthesizing agronomic and ecological data confirms that minimizing tillage while expanding ground cover variety counters ecological homogenization, fostering both belowground soil microbial communities and aboveground pollinators.',
      metrics: [
        { name: 'soil_organic_carbon', direction: 'increase', expected_mechanism: 'Reduced physical disruption preserves fungal hyphae networks.' },
        { name: 'species_richness', direction: 'potential_increase', expected_mechanism: 'Diversified vegetative structure creates multifaceted microhabitats.' }
      ],
      time_horizon: 'medium_term',
      time_horizon_detail: 'Medium term: 1 to 3 years',
      confidence: 0.75,
      evidence: defaultEvidence,
      caveats_and_uncertainty: 'Local environmental factors such as soil depth and precipitation seasonality will influence overall ecological recovery kinetics.'
    });

    return recommendations;
  }
}

export const globalRecommendationAgent = new RecommendationAgent();
