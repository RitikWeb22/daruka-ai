export interface SoilHealth {
  ph?: number;
  organic_carbon_percent?: number;
  moisture_percent?: number;
  nutrients?: string;
  degradation_level?: string;
  microbial_activity?: string;
}

export interface LandUse {
  type?: string;
  crop?: string;
  cropping_system?: string;
  habitat_fragmentation?: string;
  habitat_diversity?: string;
}

export interface Climate {
  region?: string;
  temperature_c?: number;
  rainfall?: string | number;
  rainfall_variability?: string;
  drought_conditions?: boolean | string;
  seasonality?: string;
  heat_stress?: boolean | string;
}

export interface Biodiversity {
  species_richness?: string | number;
  species_diversity?: string;
  habitat_diversity?: string;
  pollinator_presence?: string | boolean;
  native_vegetation?: string;
  ecological_connectivity?: string;
}

export interface HumanImpact {
  pollution?: string;
  deforestation?: string;
  pesticide_intensity?: string;
  water_extraction?: string;
  urbanization?: string;
}

export interface EnvironmentalState {
  region?: string;
  soil: SoilHealth;
  land_use: LandUse;
  climate: Climate;
  biodiversity: Biodiversity;
  human_impact: HumanImpact;
}

export interface MetricDirection {
  name: string;
  direction: 'increase' | 'decrease' | 'stabilize' | 'potential_increase' | 'potential_stabilize';
  expected_mechanism?: string;
}

export interface ScientificEvidenceItem {
  id?: string;
  title: string;
  source: string;
  url: string;
  publication_year?: number;
  excerpt: string;
  relevance: number;
  variables_addressed: string[];
}

export interface RecommendationItem {
  recommendation: string;
  reasoning: string;
  metrics: MetricDirection[];
  time_horizon: string;
  time_horizon_detail: string;
  confidence: number | string;
  evidence: ScientificEvidenceItem[];
  caveats_and_uncertainty: string;
}

export interface CausalLink {
  factor: string;
  effect: string;
  mechanism: string;
  variables: string[];
}

export interface StructuredResponse {
  answer: string;
  environmental_assessment: string;
  completeness: {
    score: number;
    available_variables: string[];
    missing_critical_variables: string[];
    is_sufficient: boolean;
  };
  environmental_state: EnvironmentalState;
  reasoning_graph: CausalLink[];
  recommendations: RecommendationItem[];
  missing_information: string[];
  sources: ScientificEvidenceItem[];
  clarifying_questions?: string[];
}

export interface ScientificCorpusDoc {
  id: string;
  title: string;
  source: string;
  source_url: string;
  publication_year: number;
  document_type: string;
  topic: string[];
  region: string;
  credibility: string;
  chunkCount: number;
  chunks: Array<{
    chunk_id: string;
    text: string;
    variables: string[];
  }>;
}
