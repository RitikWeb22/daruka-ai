"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRITICAL_VARIABLE_DEFINITIONS = void 0;
exports.calculateCompleteness = calculateCompleteness;
exports.parseTextForEnvironmentalState = parseTextForEnvironmentalState;
exports.CRITICAL_VARIABLE_DEFINITIONS = [
    { key: 'soil.organic_carbon_percent', label: 'Soil Organic Carbon (SOC %)', weight: 0.2, group: 'soil' },
    { key: 'soil.moisture_percent', label: 'Soil Moisture / Water Content', weight: 0.15, group: 'soil' },
    { key: 'soil.ph', label: 'Soil pH', weight: 0.1, group: 'soil' },
    { key: 'land_use.crop', label: 'Current Crop', weight: 0.15, group: 'land' },
    { key: 'land_use.cropping_system', label: 'Cropping System (Monoculture vs Polyculture)', weight: 0.15, group: 'land' },
    { key: 'climate.rainfall', label: 'Rainfall / Moisture Regime', weight: 0.15, group: 'climate' },
    { key: 'region', label: 'Biogeographical Region / Climate Zone', weight: 0.1, group: 'climate' }
];
function calculateCompleteness(state, threshold = 0.5) {
    const available = [];
    const missing = [];
    let score = 0;
    // Check region
    if (state.region || state.climate?.region) {
        available.push('region');
        score += 0.1;
    }
    else {
        missing.push('region');
    }
    // Check Soil
    if (state.soil?.organic_carbon_percent !== undefined) {
        available.push('soil_organic_carbon');
        score += 0.2;
    }
    else {
        missing.push('soil_organic_carbon');
    }
    if (state.soil?.moisture_percent !== undefined) {
        available.push('soil_moisture');
        score += 0.15;
    }
    else {
        missing.push('soil_moisture');
    }
    if (state.soil?.ph !== undefined) {
        available.push('soil_ph');
        score += 0.1;
    }
    else {
        missing.push('soil_ph');
    }
    // Check Land Use
    if (state.land_use?.crop) {
        available.push('crop');
        score += 0.15;
    }
    else {
        missing.push('crop');
    }
    if (state.land_use?.cropping_system || state.land_use?.type) {
        available.push('cropping_system');
        score += 0.15;
    }
    else {
        missing.push('cropping_system');
    }
    // Check Climate
    if (state.climate?.rainfall !== undefined) {
        available.push('rainfall');
        score += 0.15;
    }
    else {
        missing.push('rainfall');
    }
    const normalizedScore = Math.min(1.0, Math.round(score * 100) / 100);
    const isSufficient = normalizedScore >= threshold;
    // Formulate natural clarifying questions
    const clarifications = [];
    if (missing.includes('soil_organic_carbon')) {
        clarifications.push('Soil organic carbon (SOC %) or qualitative soil humus level');
    }
    if (missing.includes('soil_ph')) {
        clarifications.push('Soil pH (e.g. acidic, neutral, or alkaline)');
    }
    if (missing.includes('rainfall') || missing.includes('region')) {
        clarifications.push('Approximate annual rainfall, moisture regime, or climatic region (e.g., semi-arid, temperate)');
    }
    if (missing.includes('crop') || missing.includes('cropping_system')) {
        clarifications.push('Current crop variety and management style (e.g., wheat monoculture, intercropping)');
    }
    if (!state.human_impact?.pesticide_intensity && !state.human_impact?.pollution) {
        clarifications.push('Recent changes in chemical pesticide intensity or tillage practices');
    }
    return {
        score: normalizedScore,
        available_variables: available,
        missing_critical_variables: missing,
        is_sufficient: isSufficient,
        suggested_clarifications: clarifications
    };
}
function parseTextForEnvironmentalState(text) {
    const patch = {
        soil: {},
        land_use: {},
        climate: {},
        biodiversity: {},
        human_impact: {}
    };
    const lower = text.toLowerCase();
    // Region detection
    if (lower.includes('semi-arid') || lower.includes('semi arid')) {
        patch.region = 'semi-arid';
        patch.climate.region = 'semi-arid';
    }
    else if (lower.includes('arid')) {
        patch.region = 'arid';
    }
    else if (lower.includes('tropical')) {
        patch.region = 'tropical';
    }
    else if (lower.includes('temperate')) {
        patch.region = 'temperate';
    }
    // Rainfall
    if (lower.includes('low rainfall') || lower.includes('low rain') || lower.includes('drought') || lower.includes('dryland')) {
        patch.climate.rainfall = 'low';
        patch.climate.drought_conditions = 'moderate';
    }
    else if (lower.includes('high rainfall') || lower.includes('heavy rain')) {
        patch.climate.rainfall = 'high';
    }
    else if (lower.includes('moderate rainfall')) {
        patch.climate.rainfall = 'moderate';
    }
    const rainMatch = lower.match(/(\d{2,4})\s*(?:mm|millimeter)/);
    if (rainMatch) {
        patch.climate.rainfall = parseFloat(rainMatch[1]);
    }
    // Crop & Land Use
    if (lower.includes('wheat'))
        patch.land_use.crop = 'wheat';
    if (lower.includes('corn') || lower.includes('maize'))
        patch.land_use.crop = 'corn';
    if (lower.includes('soy') || lower.includes('soybean'))
        patch.land_use.crop = 'soybean';
    if (lower.includes('rice'))
        patch.land_use.crop = 'rice';
    if (lower.includes('barley'))
        patch.land_use.crop = 'barley';
    if (lower.includes('cotton'))
        patch.land_use.crop = 'cotton';
    if (lower.includes('monoculture') || lower.includes('single crop') || lower.includes('mono-culture')) {
        patch.land_use.cropping_system = 'monoculture';
    }
    else if (lower.includes('polyculture') || lower.includes('intercrop') || lower.includes('mixed crop')) {
        patch.land_use.cropping_system = 'polyculture';
    }
    else if (lower.includes('agroforestry')) {
        patch.land_use.cropping_system = 'agroforestry';
    }
    // Soil Organic Carbon (SOC)
    // Handles: "soc = 0.3%", "organic carbon is 0.3%", "soc is 0.3", "carbon is 0.3%"
    const socMatch = lower.match(/(?:soc|organic carbon|soil organic carbon|carbon)\s*(?:is|=|:)?\s*([0-9.]+)\s*%?/);
    if (socMatch) {
        const val = parseFloat(socMatch[1]);
        if (!isNaN(val) && val < 50) {
            patch.soil.organic_carbon_percent = val;
        }
    }
    // Soil pH
    const phMatch = lower.match(/(?:soil\s*)?ph\s*(?:is|=|:)?\s*([0-9.]+)/);
    if (phMatch) {
        const val = parseFloat(phMatch[1]);
        if (!isNaN(val) && val >= 0 && val <= 14) {
            patch.soil.ph = val;
        }
    }
    // Soil Moisture
    const moistureMatch = lower.match(/(?:soil\s*)?moisture\s*(?:is|=|:)?\s*([0-9.]+)\s*%?/);
    if (moistureMatch) {
        const val = parseFloat(moistureMatch[1]);
        if (!isNaN(val) && val >= 0 && val <= 100) {
            patch.soil.moisture_percent = val;
        }
    }
    // Human Impact / Pesticide
    if (lower.includes('high pesticide') || lower.includes('intensive pesticide') || lower.includes('heavy chemical')) {
        patch.human_impact.pesticide_intensity = 'high';
    }
    else if (lower.includes('organic') || lower.includes('zero pesticide') || lower.includes('no chemical')) {
        patch.human_impact.pesticide_intensity = 'low';
    }
    return patch;
}
