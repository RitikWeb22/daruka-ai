import { z } from 'zod';

export interface SoilHealth {
  ph?: number;
  organic_carbon_percent?: number;
  moisture_percent?: number;
  nutrients?: string;
  degradation_level?: 'none' | 'low' | 'moderate' | 'severe';
  microbial_activity?: 'low' | 'moderate' | 'high';
}

export interface LandUse {
  type?: 'cropland' | 'forest' | 'grassland' | 'wetland' | 'urban' | 'bare';
  crop?: string;
  cropping_system?: 'monoculture' | 'polyculture' | 'agroforestry' | 'crop_rotation' | 'strip_cropping';
  habitat_fragmentation?: 'low' | 'moderate' | 'high';
  habitat_diversity?: 'low' | 'moderate' | 'high';
}

export interface Climate {
  region?: string;
  temperature_c?: number;
  rainfall?: 'low' | 'moderate' | 'high' | number;
  rainfall_variability?: 'low' | 'moderate' | 'high';
  drought_conditions?: boolean | 'mild' | 'moderate' | 'severe';
  seasonality?: string;
  heat_stress?: boolean | 'low' | 'moderate' | 'high';
}

export interface Biodiversity {
  species_richness?: 'low' | 'moderate' | 'high' | number;
  species_diversity?: 'low' | 'moderate' | 'high';
  habitat_diversity?: 'low' | 'moderate' | 'high';
  pollinator_presence?: 'low' | 'moderate' | 'high' | boolean;
  native_vegetation?: 'low' | 'moderate' | 'high' | string;
  ecological_connectivity?: 'low' | 'moderate' | 'high';
}

export interface HumanImpact {
  pollution?: 'low' | 'moderate' | 'high';
  deforestation?: 'low' | 'moderate' | 'high';
  pesticide_intensity?: 'low' | 'moderate' | 'high';
  water_extraction?: 'low' | 'moderate' | 'high';
  urbanization?: 'low' | 'moderate' | 'high';
}

export interface EnvironmentalState {
  region?: string;
  soil: SoilHealth;
  land_use: LandUse;
  climate: Climate;
  biodiversity: Biodiversity;
  human_impact: HumanImpact;
  raw_observations?: string[];
  updated_at?: string;
}

export const SoilHealthSchema = z.object({
  ph: z.number().min(0).max(14).optional(),
  organic_carbon_percent: z.number().min(0).max(100).optional(),
  moisture_percent: z.number().min(0).max(100).optional(),
  nutrients: z.string().optional(),
  degradation_level: z.enum(['none', 'low', 'moderate', 'severe']).optional(),
  microbial_activity: z.enum(['low', 'moderate', 'high']).optional()
});

export const LandUseSchema = z.object({
  type: z.enum(['cropland', 'forest', 'grassland', 'wetland', 'urban', 'bare']).optional(),
  crop: z.string().optional(),
  cropping_system: z.enum(['monoculture', 'polyculture', 'agroforestry', 'crop_rotation', 'strip_cropping']).optional(),
  habitat_fragmentation: z.enum(['low', 'moderate', 'high']).optional(),
  habitat_diversity: z.enum(['low', 'moderate', 'high']).optional()
});

export const ClimateSchema = z.object({
  region: z.string().optional(),
  temperature_c: z.number().min(-50).max(65).optional(),
  rainfall: z.union([z.enum(['low', 'moderate', 'high']), z.number()]).optional(),
  rainfall_variability: z.enum(['low', 'moderate', 'high']).optional(),
  drought_conditions: z.union([z.boolean(), z.enum(['mild', 'moderate', 'severe'])]).optional(),
  seasonality: z.string().optional(),
  heat_stress: z.union([z.boolean(), z.enum(['low', 'moderate', 'high'])]).optional()
});

export const BiodiversitySchema = z.object({
  species_richness: z.union([z.enum(['low', 'moderate', 'high']), z.number()]).optional(),
  species_diversity: z.enum(['low', 'moderate', 'high']).optional(),
  habitat_diversity: z.enum(['low', 'moderate', 'high']).optional(),
  pollinator_presence: z.union([z.enum(['low', 'moderate', 'high']), z.boolean()]).optional(),
  native_vegetation: z.union([z.enum(['low', 'moderate', 'high']), z.string()]).optional(),
  ecological_connectivity: z.enum(['low', 'moderate', 'high']).optional()
});

export const HumanImpactSchema = z.object({
  pollution: z.enum(['low', 'moderate', 'high']).optional(),
  deforestation: z.enum(['low', 'moderate', 'high']).optional(),
  pesticide_intensity: z.enum(['low', 'moderate', 'high']).optional(),
  water_extraction: z.enum(['low', 'moderate', 'high']).optional(),
  urbanization: z.enum(['low', 'moderate', 'high']).optional()
});

export const EnvironmentalStateSchema = z.object({
  region: z.string().optional(),
  soil: SoilHealthSchema.default({}),
  land_use: LandUseSchema.default({}),
  climate: ClimateSchema.default({}),
  biodiversity: BiodiversitySchema.default({}),
  human_impact: HumanImpactSchema.default({})
});

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

export type NumericalClaimType = 'DIRECT_EVIDENCE' | 'DERIVED_ESTIMATE' | 'MODEL_ESTIMATE' | 'UNKNOWN';

export interface RecommendationItem {
  recommendation: string;
  reasoning: string;
  metrics: MetricDirection[];
  time_horizon: 'short_term' | 'medium_term' | 'long_term';
  time_horizon_detail: string;
  confidence: number | 'low' | 'moderate' | 'high';
  evidence: ScientificEvidenceItem[];
  caveats_and_uncertainty: string;
  numerical_claims?: Array<{
    value: string;
    claim_type: NumericalClaimType;
    source: string;
    conditions: string;
  }>;
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
