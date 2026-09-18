import { EnvironmentalState } from '../environmental/schema';
import { globalRedis } from '../services/redisService';
import { globalMongo } from '../services/mongoService';

export function createDefaultEnvironmentalState(): EnvironmentalState {
  return {
    soil: {},
    land_use: {},
    climate: {},
    biodiversity: {},
    human_impact: {},
    raw_observations: [],
    updated_at: new Date().toISOString()
  };
}

export class EnvironmentalStateManager {
  private states: Map<string, EnvironmentalState> = new Map();

  public getState(sessionId: string): EnvironmentalState {
    if (!this.states.has(sessionId)) {
      this.states.set(sessionId, createDefaultEnvironmentalState());
    }
    return this.states.get(sessionId)!;
  }

  public async getStateAsync(sessionId: string): Promise<EnvironmentalState> {
    const cached = await globalRedis.get<EnvironmentalState>(`session:${sessionId}:env_state`);
    if (cached) {
      this.states.set(sessionId, cached);
      return cached;
    }

    // Try MongoDB fallback if cache miss
    const mongoState = await globalMongo.getEnvironmentalState(sessionId);
    if (mongoState && mongoState.state) {
      const state = mongoState.state as EnvironmentalState;
      this.states.set(sessionId, state);
      // Repopulate Redis cache
      globalRedis.set(`session:${sessionId}:env_state`, state, 86400).catch(() => {});
      return state;
    }

    return this.getState(sessionId);
  }

  public updateState(sessionId: string, patch: Partial<EnvironmentalState>): EnvironmentalState {
    const current = this.getState(sessionId);

    const merged: EnvironmentalState = {
      region: patch.region || current.region,
      soil: {
        ...current.soil,
        ...patch.soil
      },
      land_use: {
        ...current.land_use,
        ...patch.land_use
      },
      climate: {
        ...current.climate,
        ...patch.climate
      },
      biodiversity: {
        ...current.biodiversity,
        ...patch.biodiversity
      },
      human_impact: {
        ...current.human_impact,
        ...patch.human_impact
      },
      raw_observations: [
        ...(current.raw_observations || []),
        ...(patch.raw_observations || [])
      ],
      updated_at: new Date().toISOString()
    };

    // Synchronize climate region with top-level region if present
    if (merged.region && !merged.climate.region) {
      merged.climate.region = merged.region;
    } else if (merged.climate.region && !merged.region) {
      merged.region = merged.climate.region;
    }

    this.states.set(sessionId, merged);

    // Async sync to Redis with 24-hour expiration
    globalRedis.set(`session:${sessionId}:env_state`, merged, 86400).catch(() => {});

    // Async persistent sync to MongoDB Atlas
    globalMongo.saveEnvironmentalState(sessionId, merged, 1.0).catch(() => {});

    return merged;
  }

  public resetState(sessionId: string): EnvironmentalState {
    const fresh = createDefaultEnvironmentalState();
    this.states.set(sessionId, fresh);
    globalRedis.del(`session:${sessionId}:env_state`).catch(() => {});
    globalMongo.saveEnvironmentalState(sessionId, fresh, 0).catch(() => {});
    return fresh;
  }
}

export const globalStateManager = new EnvironmentalStateManager();
