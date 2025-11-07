import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

/**
 * Mock Verification System
 * 
 * Simulates the real verification flow for demonstration
 * Shows how the Agent Network will display real verification progress
 */

class MockVerificationSystem extends EventEmitter {
    constructor() {
        super();
        this.activeVerifications = new Map();
        this.completedVerifications = new Map();
        this.simulators = new Map();
        
        // Initialize mock simulators
        this.initializeMockSimulators();
    }

    initializeMockSimulators() {
        const simulators = [
            { id: 'SIM-001', address: '0x1234...5678', status: 'active' },
            { id: 'SIM-002', address: '0x2345...6789', status: 'active' },
            { id: 'SIM-003', address: '0x3456...7890', status: 'active' }
        ];

        simulators.forEach(sim => {
            this.simulators.set(sim.id, {
                ...sim,
                totalAnalyzed: Math.floor(Math.random() * 100),
                threatsDetected: Math.floor(Math.random() * 10),
                avgRiskScore: Math.floor(Math.random() * 30) + 10,
                lastSeen: Date.now()
            });
        });
    }

    // Simulate intent submission from Command Center
    submitIntent(intentData) {
        const intentId = this.generateIntentId();
        
        console.log('📨 New Intent Submitted:', intentId);
        console.log('👤 User:', intentData.user);
        console.log('🎯 Target:', intentData.target);
        
        // Store active verification
        this.activeVerifications.set(intentId, {
            intentId,
            ...intentData,
            status: 'analyzing',
            simulatorResults: [],
            startTime: Date.now(),
            progress: 0
        });

        // Emit event for WebSocket clients
        this.emit('intentSubmitted', { intentId, ...intentData });

        // Start mock verification process
        this.startMockVerification(intentId);

        return intentId;
    }

    async startMockVerification(intentId) {
        const verification = this.activeVerifications.get(intentId);
        if (!verification) return;

        console.log('🔬 Starting verification for:', intentId);

        // Simulate each simulator analyzing the intent
        const simulatorIds = Array.from(this.simulators.keys());
        
        for (let i = 0; i < simulatorIds.length; i++) {
            const simulatorId = simulatorIds[i];
            
            // Simulate analysis delay
            setTimeout(async () => {
                await this.simulateAnalysis(intentId, simulatorId);
            }, (i + 1) * 2000); // Stagger the results
        }
    }

    async simulateAnalysis(intentId, simulatorId) {
        const verification = this.activeVerifications.get(intentId);
        if (!verification || verification.status !== 'analyzing') return;

        console.log(`🔍 Simulator ${simulatorId} analyzing ${intentId}...`);

        // Simulate analysis layers
        const analysisLayers = {
            stateVerification: { risk: Math.floor(Math.random() * 20) + 5 },
            honeypotDetection: { risk: Math.floor(Math.random() * 15) + 5 },
            approvalAnalysis: { risk: Math.floor(Math.random() * 25) + 10 },
            contractAnalysis: { risk: Math.floor(Math.random() * 20) + 5 },
            behaviorAnalysis: { risk: Math.floor(Math.random() * 10) + 5 }
        };

        // Calculate overall risk score
        const riskScore = Math.floor(
            (analysisLayers.stateVerification.risk * 0.4 +
             analysisLayers.honeypotDetection.risk * 0.25 +
             analysisLayers.approvalAnalysis.risk * 0.2 +
             analysisLayers.contractAnalysis.risk * 0.1 +
             analysisLayers.behaviorAnalysis.risk * 0.05)
        );

        const isRisky = riskScore > 50;

        const result = {
            simulatorId,
            riskScore,
            isRisky,
            analysisLayers,
            timestamp: Date.now(),
            recommendation: isRisky ? 'BLOCK' : 'APPROVE'
        };

        // Add result to verification
        verification.simulatorResults.push(result);
        verification.progress = Math.min((verification.simulatorResults.length / 3) * 100, 100);

        console.log(`✅ Simulator ${simulatorId} completed analysis:`, {
            riskScore,
            isRisky,
            recommendation: result.recommendation
        });

        // Emit progress update
        this.emit('analysisProgress', {
            intentId,
            simulatorId,
            result,
            progress: verification.progress
        });

        // Check if verification is complete
        if (verification.simulatorResults.length >= 2) {
            this.completeVerification(intentId);
        }
    }

    completeVerification(intentId) {
        const verification = this.activeVerifications.get(intentId);
        if (!verification) return;

        const results = verification.simulatorResults;
        const riskyCount = results.filter(r => r.isRisky).length;
        const avgRiskScore = Math.round(
            results.reduce((sum, r) => sum + r.riskScore, 0) / results.length
        );

        const isSafe = riskyCount === 0 && avgRiskScore < 50;
        const finalStatus = isSafe ? 'approved' : 'blocked';

        verification.status = finalStatus;
        verification.consensus = {
            isSafe,
            avgRiskScore,
            riskyCount,
            totalCount: results.length,
            completedAt: Date.now()
        };

        // Move to completed
        this.completedVerifications.set(intentId, verification);
        this.activeVerifications.delete(intentId);

        console.log(`🎯 Verification completed for ${intentId}: ${finalStatus.toUpperCase()}`);
        console.log(`📊 Risk Score: ${avgRiskScore}, Risky Count: ${riskyCount}/${results.length}`);

        // Emit completion
        this.emit('verificationComplete', {
            intentId,
            status: finalStatus,
            consensus: verification.consensus
        });
    }

    generateIntentId() {
        return '0x' + Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getVerificationStatus(intentId) {
        const active = this.activeVerifications.get(intentId);
        const completed = this.completedVerifications.get(intentId);

        if (completed) {
            return {
                intentId,
                status: 'completed',
                result: completed.status,
                consensus: completed.consensus,
                analysisTime: completed.consensus.completedAt - completed.startTime,
                simulatorResults: completed.simulatorResults
            };
        }

        if (active) {
            return {
                intentId,
                status: active.status,
                progress: active.progress,
                simulatorResults: active.simulatorResults,
                elapsedTime: Date.now() - active.startTime
            };
        }

        return { intentId, status: 'not_found' };
    }

    getActiveVerifications() {
        return Array.from(this.activeVerifications.values()).map(v => ({
            intentId: v.intentId,
            progress: v.progress,
            simulatorCount: v.simulatorResults.length,
            elapsedTime: Date.now() - v.startTime
        }));
    }

    getRecentCompletions(limit = 10) {
        return Array.from(this.completedVerifications.values())
            .sort((a, b) => b.consensus.completedAt - a.consensus.completedAt)
            .slice(0, limit)
            .map(v => ({
                intentId: v.intentId,
                status: v.status,
                riskScore: v.consensus.avgRiskScore,
                analysisTime: v.consensus.completedAt - v.startTime,
                timestamp: v.consensus.completedAt
            }));
    }

    getSimulatorStatuses() {
        return Array.from(this.simulators.values());
    }

    getMetrics() {
        const simulators = Array.from(this.simulators.values());
        return {
            totalSimulators: simulators.length,
            activeSimulators: simulators.filter(s => s.status === 'active').length,
            totalAnalyzed: simulators.reduce((sum, s) => sum + s.totalAnalyzed, 0),
            totalThreats: simulators.reduce((sum, s) => sum + s.threatsDetected, 0),
            avgRiskScore: Math.round(
                simulators.reduce((sum, s) => sum + s.avgRiskScore, 0) / simulators.length
            ),
            activeVerifications: this.activeVerifications.size,
            completedVerifications: this.completedVerifications.size
        };
    }
}

// Create Express app
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Initialize mock verification system
const mockVerification = new MockVerificationSystem();

// API Routes
app.get('/api/simulator/status', (req, res) => {
    res.json({
        health: { status: 'healthy', activeSimulators: 3 },
        metrics: mockVerification.getMetrics(),
        simulators: mockVerification.getSimulatorStatuses(),
        timestamp: Date.now()
    });
});

app.get('/api/simulator/verification/:intentId', (req, res) => {
    const status = mockVerification.getVerificationStatus(req.params.intentId);
    res.json({ ...status, timestamp: Date.now() });
});

app.get('/api/simulator/active', (req, res) => {
    const active = mockVerification.getActiveVerifications();
    res.json({ active, count: active.length, timestamp: Date.now() });
});

app.get('/api/simulator/recent', (req, res) => {
    const recent = mockVerification.getRecentCompletions();
    res.json({ recent, count: recent.length, timestamp: Date.now() });
});

// Submit intent endpoint (for testing)
app.post('/api/simulator/submit-intent', (req, res) => {
    const intentId = mockVerification.submitIntent({
        user: req.body.user || '0x1234567890123456789012345678901234567890',
        target: req.body.target || '0x0987654321098765432109876543210987654321',
        callData: req.body.callData || '0xa9059cbb',
        value: req.body.value || '0'
    });

    res.json({ intentId, message: 'Intent submitted for verification' });
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
    console.log('📡 New WebSocket connection');

    // Send initial status
    ws.send(JSON.stringify({
        type: 'status',
        data: mockVerification.getMetrics()
    }));

    // Set up event listeners
    const onIntentSubmitted = (data) => {
        ws.send(JSON.stringify({ type: 'intentSubmitted', data }));
    };

    const onAnalysisProgress = (data) => {
        ws.send(JSON.stringify({ type: 'analysisProgress', data }));
    };

    const onVerificationComplete = (data) => {
        ws.send(JSON.stringify({ type: 'verificationComplete', data }));
    };

    mockVerification.on('intentSubmitted', onIntentSubmitted);
    mockVerification.on('analysisProgress', onAnalysisProgress);
    mockVerification.on('verificationComplete', onVerificationComplete);

    ws.on('close', () => {
        console.log('📡 WebSocket connection closed');
        mockVerification.off('intentSubmitted', onIntentSubmitted);
        mockVerification.off('analysisProgress', onAnalysisProgress);
        mockVerification.off('verificationComplete', onVerificationComplete);
    });
});

app.get('/', (req, res) => {
    res.json({
        name: 'Mock Vigilant Verification System',
        description: 'Demonstrates real verification flow',
        endpoints: {
            status: '/api/simulator/status',
            submitIntent: 'POST /api/simulator/submit-intent',
            verification: '/api/simulator/verification/:intentId'
        }
    });
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
    console.log('🎭 Mock Vigilant Verification System running on port', PORT);
    console.log('📡 WebSocket available at ws://localhost:' + PORT);
    console.log('🔍 API available at http://localhost:' + PORT + '/api/simulator');
    console.log('\n📋 To test the system:');
    console.log('1. POST to /api/simulator/submit-intent');
    console.log('2. Watch real-time verification progress');
    console.log('3. See results in Agent Network page');
});

export default mockVerification;