import mongoose, { Schema, Document } from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Ensure DNS resolution succeeds on Windows environments for MongoDB SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

export interface IChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface IConversationDocument extends Document {
  sessionId: string;
  turns: IChatTurn[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnvironmentalStateDocument extends Document {
  sessionId: string;
  state: Record<string, any>;
  completenessScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    turns: [
      {
        id: { type: String, required: true },
        role: { type: String, required: true, enum: ['user', 'assistant'] },
        content: { type: String, required: true },
        timestamp: { type: String, required: true },
        metadata: { type: Schema.Types.Mixed, default: {} }
      }
    ]
  },
  { timestamps: true }
);

const EnvironmentalStateSchema = new Schema<IEnvironmentalStateDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    state: { type: Schema.Types.Mixed, required: true, default: {} },
    completenessScore: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

export const ConversationModel = mongoose.models.Conversation || 
  mongoose.model<IConversationDocument>('Conversation', ConversationSchema);

export const EnvironmentalStateModel = mongoose.models.EnvironmentalState || 
  mongoose.model<IEnvironmentalStateDocument>('EnvironmentalState', EnvironmentalStateSchema);

class MongoService {
  private isConnected = false;

  public async connect(): Promise<boolean> {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('ℹ️ [MongoDB] MONGODB_URI not configured. Operating in high-speed Redis / in-memory mode.');
      return false;
    }

    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000
      });

      this.isConnected = true;
      const dbName = mongoose.connection.name;
      console.log(`✅ [MongoDB] Connected successfully to MongoDB Atlas (DB: ${dbName})`);
      return true;
    } catch (err: any) {
      this.isConnected = false;
      console.warn(`⚠️ [MongoDB] Connection warning: ${err.message}. Falling back to Redis / memory storage.`);
      return false;
    }
  }

  public getStatus(): { connected: boolean; database?: string; host?: string } {
    return {
      connected: this.isConnected && mongoose.connection.readyState === 1,
      database: mongoose.connection.name,
      host: mongoose.connection.host
    };
  }

  public async saveConversation(sessionId: string, turns: IChatTurn[]): Promise<void> {
    if (!this.isConnected || mongoose.connection.readyState !== 1) return;
    try {
      await ConversationModel.findOneAndUpdate(
        { sessionId },
        { sessionId, turns },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    } catch (err: any) {
      console.warn(`⚠️ [MongoDB] Error saving conversation for session ${sessionId}:`, err.message);
    }
  }

  public async getConversation(sessionId: string): Promise<IChatTurn[] | null> {
    if (!this.isConnected || mongoose.connection.readyState !== 1) return null;
    try {
      const doc = await ConversationModel.findOne({ sessionId });
      return doc ? (doc.turns as IChatTurn[]) : null;
    } catch (err: any) {
      console.warn(`⚠️ [MongoDB] Error fetching conversation for session ${sessionId}:`, err.message);
      return null;
    }
  }

  public async saveEnvironmentalState(sessionId: string, state: Record<string, any>, completenessScore: number): Promise<void> {
    if (!this.isConnected || mongoose.connection.readyState !== 1) return;
    try {
      await EnvironmentalStateModel.findOneAndUpdate(
        { sessionId },
        { sessionId, state, completenessScore },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    } catch (err: any) {
      console.warn(`⚠️ [MongoDB] Error saving environmental state for session ${sessionId}:`, err.message);
    }
  }

  public async getEnvironmentalState(sessionId: string): Promise<{ state: Record<string, any>; completenessScore: number } | null> {
    if (!this.isConnected || mongoose.connection.readyState !== 1) return null;
    try {
      const doc = await EnvironmentalStateModel.findOne({ sessionId });
      if (!doc) return null;
      return {
        state: doc.state,
        completenessScore: doc.completenessScore
      };
    } catch (err: any) {
      console.warn(`⚠️ [MongoDB] Error fetching environmental state for session ${sessionId}:`, err.message);
      return null;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
    }
  }
}

export const globalMongo = new MongoService();
