import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { SimulatorManager } from './simulator/SimulatorManager.js';
import simulatorRoutes from './routes/simulator.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Contract ABI (simplified for VigilantSimple)
const VIGILANT_ABI = [
    "event IntentSubmitted(bytes32 indexed intentId, address indexed user, address indexed target, bytes32 stateSnapshot, uint256 timestamp)",
    "function getIntent(bytes32 intentId) view returns (tuple(address user, address target, bytes callData, uint256 value, uint256 timestamp, uint256 deadline, bytes32 stateSnapshot, uint8 status, bool exists))",
    "function submitSimulation(bytes32 intentId, bool isRisky, uint256 riskScore)",
    "function addSimulator(address simulator)",
    "function authorizedSimulators(address) view returns (bool)"
];

/**
 * Initialize Simulator System
 */
async function initializeSimulators() {
    console.log('🚀 Initializing Vigilant Simulator System...');
    
    const config = {
        rpcUrl: process.env.SOMNIA_RPC || process.env.RPC_URL || 'https://dream-rpc.somnia.network',
        contractAddress: process.env.VIGILANT_SIMPLE_ADDRESS || process.env.VIGILANT_ADDRESS || '0x0a85B911247995B6CC664BE84cDa6FDE9dE63F24',
        contractABI: VIGILANT_ABI,
        
        // Multiple simulator private keys for redundancy
        simulator1Key: process.env.SIMULATOR_1_KEY || process.env.PRIVATE_KEY,
        simulator2Key: process.env.SIMULATOR_2_KEY,
        simulator3Key: process.env.SIMULATOR_3_KEY
    };

    const simulatorManager = new SimulatorManager();
    
    try {
        await simulatorManager.initialize(config);
        
        // Store manager in app for route access
        app.set('simulatorManager', simulatorManager);
        
        console.log('✅ Simulator system initialized successfully');
        return simulatorManager;
        
    } catch (error) {
        console.error('❌ Failed to initialize simulator system:', error);
        throw error;
    }
}

/**
 * Setup WebSocket connections
 */
function setupWebSocket(simulatorManager) {
    wss.on('connection', simulatorRoutes.ws(wss));
    console.log('📡 WebSocket server initialized');
}

/**
 * API Routes
 */
app.use('/api/simulator', simulatorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    const simulatorManager = app.get('simulatorManager');
    
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        simulator: simulatorManager ? simulatorManager.getHealth() : null
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Vigilant Simulator Service',
        version: '1.0.0',
        description: 'SST Protection Simulator Network',
        endpoints: {
            health: '/health',
            simulator: '/api/simulator/*',
            websocket: 'ws://localhost:3001'
        }
    });
});

/**
 * Error handling
 */
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

/**
 * Start server
 */
async function startServer() {
    const PORT = process.env.PORT || 3001;
    
    try {
        // Initialize simulator system
        const simulatorManager = await initializeSimulators();
        
        // Setup WebSocket
        setupWebSocket(simulatorManager);
        
        // Start HTTP server
        server.listen(PORT, () => {
            console.log(`🌐 Vigilant Simulator Service running on port ${PORT}`);
            console.log(`📡 WebSocket available at ws://localhost:${PORT}`);
            console.log(`🔍 API available at http://localhost:${PORT}/api/simulator`);
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down Vigilant Simulator Service...');
            
            if (simulatorManager) {
                await simulatorManager.stop();
            }
            
            server.close(() => {
                console.log('✅ Server shut down gracefully');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('💥 Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();