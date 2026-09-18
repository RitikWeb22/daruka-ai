"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const ingest_1 = require("./rag/ingest");
const mongoService_1 = require("./services/mongoService");
const PORT = process.env.PORT || 5000;
async function bootstrap() {
    console.log('------------------------------------------------------------');
    console.log('🌱 Starting Darukaa.Earth — AI Biodiversity Intelligence...');
    console.log('------------------------------------------------------------');
    try {
        // Ingest and index authoritative scientific documents into vector database
        await (0, ingest_1.ingestScientificDocuments)();
        // Initialize MongoDB Atlas connection
        await mongoService_1.globalMongo.connect();
        app_1.default.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📡 Ready to accept environmental queries via /api/chat`);
            console.log(`🔬 Endpoints:`);
            console.log(`   - POST http://localhost:${PORT}/api/chat`);
            console.log(`   - GET  http://localhost:${PORT}/api/environmental/corpus`);
            console.log(`   - GET  http://localhost:${PORT}/api/environmental/state/:sessionId`);
            console.log('------------------------------------------------------------');
        });
    }
    catch (error) {
        console.error('❌ Bootstrap failure:', error);
        process.exit(1);
    }
}
bootstrap();
