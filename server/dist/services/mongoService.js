"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalMongo = exports.EnvironmentalStateModel = exports.ConversationModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from server/.env or root .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
// Ensure DNS resolution succeeds on Windows environments for MongoDB SRV records
try {
    dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
}
catch {
    // Ignore in environments where setting DNS servers is restricted
}
const ConversationSchema = new mongoose_1.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    turns: [
        {
            id: { type: String, required: true },
            role: { type: String, required: true, enum: ['user', 'assistant'] },
            content: { type: String, required: true },
            timestamp: { type: String, required: true },
            metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} }
        }
    ]
}, { timestamps: true });
const EnvironmentalStateSchema = new mongoose_1.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    state: { type: mongoose_1.Schema.Types.Mixed, required: true, default: {} },
    completenessScore: { type: Number, required: true, default: 0 }
}, { timestamps: true });
exports.ConversationModel = mongoose_1.default.models.Conversation ||
    mongoose_1.default.model('Conversation', ConversationSchema);
exports.EnvironmentalStateModel = mongoose_1.default.models.EnvironmentalState ||
    mongoose_1.default.model('EnvironmentalState', EnvironmentalStateSchema);
class MongoService {
    isConnected = false;
    async connect() {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.log('ℹ️ [MongoDB] MONGODB_URI not configured. Operating in high-speed Redis / in-memory mode.');
            return false;
        }
        try {
            await mongoose_1.default.connect(uri, {
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000
            });
            this.isConnected = true;
            const dbName = mongoose_1.default.connection.name;
            console.log(`✅ [MongoDB] Connected successfully to MongoDB Atlas (DB: ${dbName})`);
            return true;
        }
        catch (err) {
            this.isConnected = false;
            console.warn(`⚠️ [MongoDB] Connection warning: ${err.message}. Falling back to Redis / memory storage.`);
            return false;
        }
    }
    getStatus() {
        return {
            connected: this.isConnected && mongoose_1.default.connection.readyState === 1,
            database: mongoose_1.default.connection.name,
            host: mongoose_1.default.connection.host
        };
    }
    async saveConversation(sessionId, turns) {
        if (!this.isConnected || mongoose_1.default.connection.readyState !== 1)
            return;
        try {
            await exports.ConversationModel.findOneAndUpdate({ sessionId }, { sessionId, turns }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });
        }
        catch (err) {
            console.warn(`⚠️ [MongoDB] Error saving conversation for session ${sessionId}:`, err.message);
        }
    }
    async getConversation(sessionId) {
        if (!this.isConnected || mongoose_1.default.connection.readyState !== 1)
            return null;
        try {
            const doc = await exports.ConversationModel.findOne({ sessionId });
            return doc ? doc.turns : null;
        }
        catch (err) {
            console.warn(`⚠️ [MongoDB] Error fetching conversation for session ${sessionId}:`, err.message);
            return null;
        }
    }
    async saveEnvironmentalState(sessionId, state, completenessScore) {
        if (!this.isConnected || mongoose_1.default.connection.readyState !== 1)
            return;
        try {
            await exports.EnvironmentalStateModel.findOneAndUpdate({ sessionId }, { sessionId, state, completenessScore }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });
        }
        catch (err) {
            console.warn(`⚠️ [MongoDB] Error saving environmental state for session ${sessionId}:`, err.message);
        }
    }
    async getEnvironmentalState(sessionId) {
        if (!this.isConnected || mongoose_1.default.connection.readyState !== 1)
            return null;
        try {
            const doc = await exports.EnvironmentalStateModel.findOne({ sessionId });
            if (!doc)
                return null;
            return {
                state: doc.state,
                completenessScore: doc.completenessScore
            };
        }
        catch (err) {
            console.warn(`⚠️ [MongoDB] Error fetching environmental state for session ${sessionId}:`, err.message);
            return null;
        }
    }
    async disconnect() {
        if (this.isConnected) {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
        }
    }
}
exports.globalMongo = new MongoService();
