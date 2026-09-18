import { describe, it, expect } from 'vitest';
import { globalRedis } from '../src/services/redisService';
import { globalConversationMemory } from '../src/memory/conversationMemory';
import { globalStateManager } from '../src/memory/environmentalState';

describe('Redis & Persistence Service via ioredis', () => {
  it('handles set and get operations seamlessly', async () => {
    const key = 'test:darukaa:check';
    const payload = { test: true, timestamp: Date.now() };

    await globalRedis.set(key, payload, 60);
    const retrieved = await globalRedis.get<typeof payload>(key);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.test).toBe(true);

    await globalRedis.del(key);
    const afterDel = await globalRedis.get(key);
    expect(afterDel).toBeNull();
  });

  it('synchronizes conversation turns with Redis cache', async () => {
    const sessionId = 'redis-session-test';
    globalConversationMemory.addTurn(sessionId, 'user', 'My soil organic carbon is 0.4%');

    const session = await globalConversationMemory.getSessionAsync(sessionId);
    expect(session.turns.length).toBeGreaterThan(0);
    expect(session.turns[0].content).toContain('0.4%');

    globalConversationMemory.clearSession(sessionId);
  });

  it('synchronizes environmental state facts with Redis cache', async () => {
    const sessionId = 'redis-env-test';
    globalStateManager.updateState(sessionId, {
      region: 'semi-arid',
      soil: { organic_carbon_percent: 0.3 }
    });

    const state = await globalStateManager.getStateAsync(sessionId);
    expect(state.region).toBe('semi-arid');
    expect(state.soil.organic_carbon_percent).toBe(0.3);

    globalStateManager.resetState(sessionId);
  });
});
