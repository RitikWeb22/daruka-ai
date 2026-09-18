"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const chat_1 = __importDefault(require("./routes/chat"));
const environmental_1 = __importDefault(require("./routes/environmental"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security and middleware
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '5mb' }));
const redisService_1 = require("./services/redisService");
const mongoService_1 = require("./services/mongoService");
// Health Check Endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        system: 'Darukaa.Earth AI Environmental Intelligence',
        storage: {
            mongodb: mongoService_1.globalMongo.getStatus(),
            redis: {
                connected: redisService_1.globalRedis.isLive()
            }
        },
        timestamp: new Date().toISOString()
    });
});
// Main API Routes
app.use('/api/chat', chat_1.default);
app.use('/api/environmental', environmental_1.default);
// Production Static Serving (Single-bundle Fullstack Deployment)
const clientDistPath = path_1.default.join(__dirname, '../../client/dist');
if (fs_1.default.existsSync(clientDistPath)) {
    app.use(express_1.default.static(clientDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path === '/health') {
            return next();
        }
        res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
    });
}
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('[Unhandled System Error]', err);
    res.status(500).json({
        error: 'Internal Environmental Intelligence Error',
        message: err.message
    });
});
exports.default = app;
