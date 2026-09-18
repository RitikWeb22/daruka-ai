"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECOLOGICAL_RELATIONSHIPS = void 0;
exports.extractCausalChains = extractCausalChains;
exports.ECOLOGICAL_RELATIONSHIPS = [
    {
        id: 'soc-structure-water',
        name: 'SOC & Soil Hydraulic Conductivity',
        condition: (state) => {
            const soc = state.soil.organic_carbon_percent;
            return (soc !== undefined && soc < 1.0) || state.climate.rainfall === 'low';
        },
        involved_variables: ['soil_organic_carbon', 'soil_moisture', 'rainfall'],
        chain: {
            factor: 'Low soil organic carbon (<1.0%)',
            effect: 'Compromised macro-aggregate stability and weakened water retention',
            mechanism: 'Depleted organic matter reduces soil pore networks and hydraulic retention, escalating crop drought vulnerability during dry spells.',
            variables: ['soil_organic_carbon', 'soil_moisture']
        },
        recommendation_hints: ['cover_crops', 'organic_mulch', 'reduced_tillage', 'residue_retention']
    },
    {
        id: 'monoculture-habitat-simplification',
        name: 'Monoculture & Habitat Homogenization',
        condition: (state) => {
            return state.land_use.cropping_system === 'monoculture' ||
                (state.land_use.crop !== undefined && !state.land_use.cropping_system);
        },
        involved_variables: ['crop', 'cropping_system', 'habitat_diversity', 'species_richness'],
        chain: {
            factor: 'Continuous monoculture cropping',
            effect: 'Severe habitat simplification and spatial-temporal resource gaps',
            mechanism: 'Single-species crop canopy produces uniform microclimates and pulsed resources, depriving beneficial predators, parasitoids, and pollinators of sustained nesting and food niches.',
            variables: ['cropping_system', 'habitat_diversity', 'species_richness']
        },
        recommendation_hints: ['intercropping', 'buffer_strips', 'perennial_margins', 'crop_rotation']
    },
    {
        id: 'rainfall-moisture-stress',
        name: 'Rainfall Deficit & Vegetation Stress',
        condition: (state) => {
            return state.climate.rainfall === 'low' ||
                (typeof state.climate.rainfall === 'number' && state.climate.rainfall < 400) ||
                state.climate.region?.toLowerCase().includes('semi-arid') ||
                state.region?.toLowerCase().includes('semi-arid') || false;
        },
        involved_variables: ['rainfall', 'region', 'soil_moisture'],
        chain: {
            factor: 'Low precipitation / Semi-arid regime',
            effect: 'Elevated evaporative demand and persistent soil moisture deficits',
            mechanism: 'Sub-400mm annual precipitation constrains biomass production and microbial respiration; unprotected bare soil experiences accelerated moisture loss.',
            variables: ['rainfall', 'soil_moisture', 'temperature']
        },
        recommendation_hints: ['stubble_mulch', 'drought_tolerant_legumes', 'agroforestry_windbreaks']
    },
    {
        id: 'multi-variable-synergy-arid-soc-mono',
        name: 'Tri-Variable Stress Interaction (Arid + Low SOC + Monoculture)',
        condition: (state) => {
            const isSemiArid = state.region?.toLowerCase().includes('semi-arid') || state.climate.rainfall === 'low';
            const isLowSoc = state.soil.organic_carbon_percent !== undefined && state.soil.organic_carbon_percent < 0.8;
            const isMono = state.land_use.cropping_system === 'monoculture' || Boolean(state.land_use.crop);
            return Boolean(isSemiArid && isLowSoc && isMono);
        },
        involved_variables: ['rainfall', 'soil_organic_carbon', 'crop', 'habitat_diversity'],
        chain: {
            factor: 'Multi-variable nexus: Semi-arid climate + low SOC + monoculture',
            effect: 'Compounded ecological vulnerability across moisture, soil biological vitality, and biodiversity',
            mechanism: 'Water limitation restricts natural carbon accumulation, while monoculture lacks root architecture variety. The simultaneous stress amplifies soil degradation, reduces microbial diversity, and strips away insect biodiversity.',
            variables: ['rainfall', 'soil_organic_carbon', 'cropping_system', 'biodiversity']
        },
        recommendation_hints: ['legume_intercropping', 'cover_crop_strips', 'conservation_agriculture']
    },
    {
        id: 'pesticide-pollinator-decline',
        name: 'Chemical Disturbance & Trophic Collapse',
        condition: (state) => {
            return state.human_impact.pesticide_intensity === 'high' || state.human_impact.pollution === 'high';
        },
        involved_variables: ['pesticide_intensity', 'pollinator_presence', 'species_diversity'],
        chain: {
            factor: 'High chemical disturbance / pesticide intensity',
            effect: 'Depressed beneficial arthropods, natural biocontrol agents, and wild pollinators',
            mechanism: 'Broad-spectrum chemical applications kill beneficial non-target organisms and disrupt soil microbial networks, increasing risk of secondary pest resurgences.',
            variables: ['pesticide_intensity', 'biodiversity', 'microbial_activity']
        },
        recommendation_hints: ['integrated_pest_management', 'flowering_field_borders', 'biological_controls']
    }
];
function extractCausalChains(state) {
    const chains = [];
    for (const rule of exports.ECOLOGICAL_RELATIONSHIPS) {
        if (rule.condition(state)) {
            chains.push(rule.chain);
        }
    }
    return chains;
}
