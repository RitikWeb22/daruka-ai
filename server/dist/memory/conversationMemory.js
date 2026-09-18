"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalConversationMemory = exports.ConversationMemory = void 0;
const redisService_1 = require("../services/redisService");
const mongoService_1 = require("../services/mongoService");
class ConversationMemory {
    sessions = new Map();
    getSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            const newSession = {
                sessionId,
                turns: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            this.sessions.set(sessionId, newSession);
        }
        return this.sessions.get(sessionId);
    }
    async getSessionAsync(sessionId) {
        const cached = await redisService_1.globalRedis.get(`session:${sessionId}:turns`);
        if (cached) {
            this.sessions.set(sessionId, cached);
            return cached;
        }
        // Try MongoDB fallback if cache miss
        const mongoTurns = await mongoService_1.globalMongo.getConversation(sessionId);
        if (mongoTurns && mongoTurns.length > 0) {
            const session = {
                sessionId,
                turns: mongoTurns,
                created_at: mongoTurns[0]?.timestamp || new Date().toISOString(),
                updated_at: mongoTurns[mongoTurns.length - 1]?.timestamp || new Date().toISOString()
            };
            this.sessions.set(sessionId, session);
            // Repopulate Redis cache
            redisService_1.globalRedis.set(`session:${sessionId}:turns`, session, 86400).catch(() => { });
            return session;
        }
        return this.getSession(sessionId);
    }
    addTurn(sessionId, role, content, metadata) {
        const session = this.getSession(sessionId);
        const turn = {
            id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            role,
            content,
            timestamp: new Date().toISOString(),
            metadata
        };
        session.turns.push(turn);
        session.updated_at = new Date().toISOString();
        // Async sync to Redis with 24-hour expiration
        redisService_1.globalRedis.set(`session:${sessionId}:turns`, session, 86400).catch(() => { });
        // Async persistent sync to MongoDB Atlas
        mongoService_1.globalMongo.saveConversation(sessionId, session.turns).catch(() => { });
        return turn;
    }
    getRecentTurns(sessionId, limit = 10) {
        const session = this.getSession(sessionId);
        return session.turns.slice(-limit);
    }
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
        redisService_1.globalRedis.del(`session:${sessionId}:turns`).catch(() => { });
    }
}
exports.ConversationMemory = ConversationMemory;
exports.globalConversationMemory = new ConversationMemory();
