"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentalStateSchema = exports.HumanImpactSchema = exports.BiodiversitySchema = exports.ClimateSchema = exports.LandUseSchema = exports.SoilHealthSchema = void 0;
const zod_1 = require("zod");
exports.SoilHealthSchema = zod_1.z.object({
    ph: zod_1.z.number().min(0).max(14).optional(),
    organic_carbon_percent: zod_1.z.number().min(0).max(100).optional(),
    moisture_percent: zod_1.z.number().min(0).max(100).optional(),
    nutrients: zod_1.z.string().optional(),
    degradation_level: zod_1.z.enum(['none', 'low', 'moderate', 'severe']).optional(),
    microbial_activity: zod_1.z.enum(['low', 'moderate', 'high']).optional()
});
exports.LandUseSchema = zod_1.z.object({
    type: zod_1.z.enum(['cropland', 'forest', 'grassland', 'wetland', 'urban', 'bare']).optional(),
    crop: zod_1.z.string().optional(),
    cropping_system: zod_1.z.enum(['monoculture', 'polyculture', 'agroforestry', 'crop_rotation', 'strip_cropping']).optional(),
    habitat_fragmentation: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
    habitat_diversity: zod_1.z.enum(['low', 'moderate', 'high']).optional()
});
exports.ClimateSchema = zod_1.z.object({
    region: zod_1.z.string().optional(),
    temperature_c: zod_1.z.number().min(-50).max(65).optional(),
    rainfall: zod_1.z.union([zod_1.z.enum(['low', 'moderate', 'high']), zod_1.z.number()]).optional(),
    rainfall_variability: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
    drought_conditions: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['mild', 'moderate', 'severe'])]).optional(),
    seasonality: zod_1.z.string().optional(),
    heat_stress: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['low', 'moderate', 'high'])]).optional()
});
exports.BiodiversitySchema = zod_1.z.object({
    species_richness: zod_1.z.union([zod_1.z.enum(['low', 'moderate', 'high']), zod_1.z.number()]).optional(),
    species_diversity: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
    habitat_diversity: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
    pollinator_presence: zod_1.z.union([zod_1.z.enum(['low', 'moderate', 'high']), zod_1.z.boolean()]).optional(),
    native_vegetation: zod_1.z.union([zod_1.z.enum(['low', 'moderate', 'high']), zod_1.z.string()]).optional(),
    ecological_connectivity: zod_1.z.enum(['low', 'moderate', 'high']).optional()
});
exports.HumanImpactSchema = zod_1.z.object({
    pollution: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
    deforestation: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
    pesticide_intensity: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
    water_extraction: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
    urbanization: zod_1.z.enum(['low', 'moderate', 'high']).optional()
});
exports.EnvironmentalStateSchema = zod_1.z.object({
    region: zod_1.z.string().optional(),
    soil: exports.SoilHealthSchema.default({}),
    land_use: exports.LandUseSchema.default({}),
    climate: exports.ClimateSchema.default({}),
    biodiversity: exports.BiodiversitySchema.default({}),
    human_impact: exports.HumanImpactSchema.default({})
});
