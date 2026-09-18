import app from './app';
import { ingestScientificDocuments } from './rag/ingest';
import { globalMongo } from './services/mongoService';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  console.log('------------------------------------------------------------');
  console.log('🌱 Starting Darukaa.Earth — AI Biodiversity Intelligence...');
  console.log('------------------------------------------------------------');

  try {
    // Ingest and index authoritative scientific documents into vector database
    await ingestScientificDocuments();

    // Initialize MongoDB Atlas connection
    await globalMongo.connect();

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📡 Ready to accept environmental queries via /api/chat`);
      console.log(`🔬 Endpoints:`);
      console.log(`   - POST http://localhost:${PORT}/api/chat`);
      console.log(`   - GET  http://localhost:${PORT}/api/environmental/corpus`);
      console.log(`   - GET  http://localhost:${PORT}/api/environmental/state/:sessionId`);
      console.log('------------------------------------------------------------');
    });
  } catch (error) {
    console.error('❌ Bootstrap failure:', error);
    process.exit(1);
  }
}

bootstrap();
