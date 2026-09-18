import { globalRedis } from '../services/redisService';
import { globalMongo } from '../services/mongoService';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ConversationSession {
  sessionId: string;
  turns: ChatTurn[];
  created_at: string;
  updated_at: string;
}

export class ConversationMemory {
  private sessions: Map<string, ConversationSession> = new Map();

  public getSession(sessionId: string): ConversationSession {
    if (!this.sessions.has(sessionId)) {
      const newSession: ConversationSession = {
        sessionId,
        turns: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.sessions.set(sessionId, newSession);
    }
    return this.sessions.get(sessionId)!;
  }

  public async getSessionAsync(sessionId: string): Promise<ConversationSession> {
    const cached = await globalRedis.get<ConversationSession>(`session:${sessionId}:turns`);
    if (cached) {
      this.sessions.set(sessionId, cached);
      return cached;
    }

    // Try MongoDB fallback if cache miss
    const mongoTurns = await globalMongo.getConversation(sessionId);
    if (mongoTurns && mongoTurns.length > 0) {
      const session: ConversationSession = {
        sessionId,
        turns: mongoTurns,
        created_at: mongoTurns[0]?.timestamp || new Date().toISOString(),
        updated_at: mongoTurns[mongoTurns.length - 1]?.timestamp || new Date().toISOString()
      };
      this.sessions.set(sessionId, session);
      // Repopulate Redis cache
      globalRedis.set(`session:${sessionId}:turns`, session, 86400).catch(() => {});
      return session;
    }

    return this.getSession(sessionId);
  }

  public addTurn(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, any>): ChatTurn {
    const session = this.getSession(sessionId);
    const turn: ChatTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata
    };
    session.turns.push(turn);
    session.updated_at = new Date().toISOString();

    // Async sync to Redis with 24-hour expiration
    globalRedis.set(`session:${sessionId}:turns`, session, 86400).catch(() => {});

    // Async persistent sync to MongoDB Atlas
    globalMongo.saveConversation(sessionId, session.turns).catch(() => {});

    return turn;
  }

  public getRecentTurns(sessionId: string, limit = 10): ChatTurn[] {
    const session = this.getSession(sessionId);
    return session.turns.slice(-limit);
  }

  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    globalRedis.del(`session:${sessionId}:turns`).catch(() => {});
  }
}

export const globalConversationMemory = new ConversationMemory();
