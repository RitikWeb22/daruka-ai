import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { globalMongo } from '../src/services/mongoService';

describe('MongoDB Atlas Persistence Service', () => {
  beforeAll(async () => {
    await globalMongo.connect();
  }, 15000);

  afterAll(async () => {
    await globalMongo.disconnect();
  });

  it('connects to MongoDB Atlas successfully', () => {
    const status = globalMongo.getStatus();
    expect(status.connected).toBe(true);
    expect(status.database).toBe('darukaa_ai');
  });

  it('saves and retrieves conversation turns in MongoDB', async () => {
    const testSessionId = `test-mongo-${Date.now()}`;
    const turns = [
      {
        id: 'turn-1',
        role: 'user' as const,
        content: 'Testing MongoDB conversation persistence',
        timestamp: new Date().toISOString()
      },
      {
        id: 'turn-2',
        role: 'assistant' as const,
        content: 'MongoDB persistence confirmed functional',
        timestamp: new Date().toISOString()
      }
    ];

    await globalMongo.saveConversation(testSessionId, turns);
    const retrieved = await globalMongo.getConversation(testSessionId);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.length).toBe(2);
    expect(retrieved?.[0].content).toBe('Testing MongoDB conversation persistence');
  });

  it('saves and retrieves environmental state in MongoDB', async () => {
    const testSessionId = `test-mongo-env-${Date.now()}`;
    const state = {
      region: 'arid',
      soil: { organic_carbon_percent: 0.25, ph: 7.8 },
      climate: { annual_rainfall_mm: 320 }
    };

    await globalMongo.saveEnvironmentalState(testSessionId, state, 0.75);
    const retrieved = await globalMongo.getEnvironmentalState(testSessionId);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.state.region).toBe('arid');
    expect(retrieved?.completenessScore).toBe(0.75);
  });
});
