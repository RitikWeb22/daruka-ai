import { EnvironmentalState } from '../environmental/schema';
import { parseTextForEnvironmentalState } from '../environmental/validators';

export interface NormalizedInput {
  inputType: 'text' | 'structured_json';
  rawText: string;
  extractedState: Partial<EnvironmentalState>;
  ambiguities: string[];
}

export class InputAgent {
  public processInput(input: any): NormalizedInput {
    // 1. Check if structured JSON input was provided
    if (typeof input === 'object' && input !== null && !input.text && (input.soil || input.climate || input.land_use || input.region || input.soil_organic_carbon)) {
      const extracted = this.normalizeStructuredJson(input);
      return {
        inputType: 'structured_json',
        rawText: JSON.stringify(input),
        extractedState: extracted,
        ambiguities: []
      };
    }

    // 2. Otherwise process as Text input
    const text = typeof input === 'string' ? input : (input.text || JSON.stringify(input));
    const extracted = parseTextForEnvironmentalState(text);
    const ambiguities = this.detectAmbiguities(text);

    return {
      inputType: 'text',
      rawText: text,
      extractedState: extracted,
      ambiguities
    };
  }

  private normalizeStructuredJson(json: any): Partial<EnvironmentalState> {
    const patch: Partial<EnvironmentalState> = {
      soil: {},
      land_use: {},
      climate: {},
      biodiversity: {},
      human_impact: {}
    };

    if (json.region) {
      patch.region = String(json.region).toLowerCase();
      patch.climate!.region = patch.region;
    }

    // Direct flat keys support (e.g. { "soil_organic_carbon": 0.3, "rainfall": "low", "crop": "wheat", "land_use": "monoculture" })
    if (json.soil_organic_carbon !== undefined) {
      patch.soil!.organic_carbon_percent = Number(json.soil_organic_carbon);
    }
    if (json.rainfall !== undefined) {
      patch.climate!.rainfall = json.rainfall;
    }
    if (json.crop !== undefined) {
      patch.land_use!.crop = String(json.crop).toLowerCase();
    }
    if (json.land_use !== undefined && typeof json.land_use === 'string') {
      if (['monoculture', 'polyculture', 'agroforestry', 'crop_rotation'].includes(json.land_use.toLowerCase())) {
        patch.land_use!.cropping_system = json.land_use.toLowerCase() as any;
      } else {
        patch.land_use!.type = json.land_use.toLowerCase() as any;
      }
    }

    // Nested structured keys support
    if (json.soil) {
      if (json.soil.ph !== undefined) patch.soil!.ph = Number(json.soil.ph);
      if (json.soil.organic_carbon_percent !== undefined) patch.soil!.organic_carbon_percent = Number(json.soil.organic_carbon_percent);
      if (json.soil.organic_carbon !== undefined) patch.soil!.organic_carbon_percent = Number(json.soil.organic_carbon);
      if (json.soil.moisture_percent !== undefined) patch.soil!.moisture_percent = Number(json.soil.moisture_percent);
      if (json.soil.moisture !== undefined) patch.soil!.moisture_percent = Number(json.soil.moisture);
      if (json.soil.nutrients) patch.soil!.nutrients = String(json.soil.nutrients);
      if (json.soil.degradation) patch.soil!.degradation_level = json.soil.degradation;
    }

    if (json.land_use && typeof json.land_use === 'object') {
      if (json.land_use.type) patch.land_use!.type = json.land_use.type;
      if (json.land_use.crop) patch.land_use!.crop = String(json.land_use.crop).toLowerCase();
      if (json.land_use.cropping_system) patch.land_use!.cropping_system = json.land_use.cropping_system;
      if (json.land_use.system) patch.land_use!.cropping_system = json.land_use.system;
    }

    if (json.climate) {
      if (json.climate.temperature_c !== undefined) patch.climate!.temperature_c = Number(json.climate.temperature_c);
      if (json.climate.temperature !== undefined) patch.climate!.temperature_c = Number(json.climate.temperature);
      if (json.climate.rainfall !== undefined) patch.climate!.rainfall = json.climate.rainfall;
    }

    if (json.human_impact) {
      if (json.human_impact.pollution) patch.human_impact!.pollution = json.human_impact.pollution;
      if (json.human_impact.deforestation) patch.human_impact!.deforestation = json.human_impact.deforestation;
      if (json.human_impact.pesticide_intensity) patch.human_impact!.pesticide_intensity = json.human_impact.pesticide_intensity;
      if (json.human_impact.pesticide) patch.human_impact!.pesticide_intensity = json.human_impact.pesticide;
    }

    return patch;
  }

  private detectAmbiguities(text: string): string[] {
    const ambiguities: string[] = [];
    const lower = text.toLowerCase();

    // Section 21 example: "Carbon is 0.3" -> ambiguous whether soil organic carbon or total carbon
    if (/carbon\s+is\s+[0-9.]+/i.test(lower) && !lower.includes('organic') && !lower.includes('soc')) {
      ambiguities.push('Ambiguous carbon specification: Please clarify whether this represents Soil Organic Carbon (SOC %) or total soil carbon.');
    }

    return ambiguities;
  }
}

export const globalInputAgent = new InputAgent();
