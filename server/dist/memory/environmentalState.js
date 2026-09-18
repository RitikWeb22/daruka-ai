"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalStateManager = exports.EnvironmentalStateManager = void 0;
exports.createDefaultEnvironmentalState = createDefaultEnvironmentalState;
const redisService_1 = require("../services/redisService");
const mongoService_1 = require("../services/mongoService");
function createDefaultEnvironmentalState() {
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
class EnvironmentalStateManager {
    states = new Map();
    getState(sessionId) {
        if (!this.states.has(sessionId)) {
            this.states.set(sessionId, createDefaultEnvironmentalState());
        }
        return this.states.get(sessionId);
    }
    async getStateAsync(sessionId) {
        const cached = await redisService_1.globalRedis.get(`session:${sessionId}:env_state`);
        if (cached) {
            this.states.set(sessionId, cached);
            return cached;
        }
        // Try MongoDB fallback if cache miss
        const mongoState = await mongoService_1.globalMongo.getEnvironmentalState(sessionId);
        if (mongoState && mongoState.state) {
            const state = mongoState.state;
            this.states.set(sessionId, state);
            // Repopulate Redis cache
            redisService_1.globalRedis.set(`session:${sessionId}:env_state`, state, 86400).catch(() => { });
            return state;
        }
        return this.getState(sessionId);
    }
    updateState(sessionId, patch) {
        const current = this.getState(sessionId);
        const merged = {
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
        }
        else if (merged.climate.region && !merged.region) {
            merged.region = merged.climate.region;
        }
        this.states.set(sessionId, merged);
        // Async sync to Redis with 24-hour expiration
        redisService_1.globalRedis.set(`session:${sessionId}:env_state`, merged, 86400).catch(() => { });
        // Async persistent sync to MongoDB Atlas
        mongoService_1.globalMongo.saveEnvironmentalState(sessionId, merged, 1.0).catch(() => { });
        return merged;
    }
    resetState(sessionId) {
        const fresh = createDefaultEnvironmentalState();
        this.states.set(sessionId, fresh);
        redisService_1.globalRedis.del(`session:${sessionId}:env_state`).catch(() => { });
        mongoService_1.globalMongo.saveEnvironmentalState(sessionId, fresh, 0).catch(() => { });
        return fresh;
    }
}
exports.EnvironmentalStateManager = EnvironmentalStateManager;
exports.globalStateManager = new EnvironmentalStateManager();
