import { SimulatorService } from './SimulatorService.js';
import { EventEmitter } from 'events';

/**
 * Simulator Manager
 * 
 * Manages multiple simulator instances and provides API endpoints
 * for the frontend to monitor verification progress
 */
export class SimulatorManager extends EventEmitter {
    constructor() {
        super();
        
        this.simulators = new Map();
        this.activeIntents = new Map();
        this.verificationResults = new Map();
        this.config = null;
        
        // Manager metrics
        this.metrics = {
            totalSimulators: 0,
            activeSimulators: 0,
            totalIntentsProcessed: 0,
            totalThreatsDetected: 0,
            startTime: Date.now()
        };
    }

    /**
     * Initialize the simulator manager
     */
    async initialize(config) {
        this.config = config;
        console.log('🎛️ Initializing Simulator Manager...');
        
        // Start multiple simulator instances for redundancy
        const simulatorConfigs = [
            { ...config, privateKey: config.simulator1Key },
            { ...config, privateKey: config.simulator2Key },
            { ...config, privateKey: config.simulator3Key }
        ];

        for (let i = 0; i < simulatorConfigs.length; i++) {
            if (simulatorConfigs[i].privateKey) {
                await this.createSimulator(`simulator-${i + 1}`, simulatorConfigs[i]);
            }
        }

        console.log(`✅ Simulator Manager initialized with ${this.simulators.size} simulators`);
        return true;
    }

    /**
     * Create and start a new simulator
     */
    async createSimulator(id, config) {
        try {
            console.log(`🔧 Creating simulator: ${id}`);
            
            const simulator = new SimulatorService(config);
            
            // Set up event listeners
            this.setupSimulatorEvents(simulator, id);
            
            // Initialize and start
            const initialized = await simulator.initialize(
                this.config.contractAddress,
                this.config.contractABI
            );
            
            if (initialized) {
                await simulator.start();
                this.simulators.set(id, simulator);
                this.metrics.totalSimulators++;
                this.metrics.activeSimulators++;
                
                console.log(`✅ Simulator ${id} started successfully`);
                this.emit('simulatorStarted', { id, address: simulator.wallet.address });
            }
            
        } catch (error) {
            console.error(`❌ Failed to create simulator ${id}:`, error.message);
        }
    }

    /**
     * Set up event listeners for a simulator
     */
    setupSimulatorEvents(simulator, id) {
        simulator.on('intentReceived', (data) => {
            console.log(`📨 Simulator ${id} received intent: ${data.intentId}`);
            
            // Track active intent
            if (!this.activeIntents.has(data.intentId)) {
                this.activeIntents.set(data.intentId, {
                    ...data,
                    simulators: new Set(),
                    results: [],
                    status: 'analyzing',
                    startTime: Date.now()
                });
            }
            
            this.activeIntents.get(data.intentId).simulators.add(id);
            this.emit('intentReceived', { intentId: data.intentId, simulatorId: id });
        });

        simulator.on('intentAnalyzed', (data) => {
            console.log(`✅ Simulator ${id} analyzed intent: ${data.intentId}`);
            
            // Store result
            const intent = this.activeIntents.get(data.intentId);
            if (intent) {
                intent.results.push({
                    simulatorId: id,
                    result: data.result,
                    timestamp: Date.now()
                });

                // Check if we have consensus
                this.checkConsensus(data.intentId);
            }

            this.metrics.totalIntentsProcessed++;
            if (data.result.isRisky) {
                this.metrics.totalThreatsDetected++;
            }

            this.emit('intentAnalyzed', { 
                intentId: data.intentId, 
                simulatorId: id, 
                result: data.result 
            });
        });

        simulator.on('analysisError', (data) => {
            console.error(`❌ Simulator ${id} analysis error: ${data.intentId}`);
            this.emit('analysisError', { 
                intentId: data.intentId, 
                simulatorId: id, 
                error: data.error 
            });
        });
    }

    /**
     * Check if simulators have reached consensus
     */
    checkConsensus(intentId) {
        const intent = this.activeIntents.get(intentId);
        if (!intent || intent.results.length < 2) {
            return; // Need at least 2 results
        }

        const results = intent.results;
        const riskyCount = results.filter(r => r.result.isRisky).length;
        const totalCount = results.length;
        
        // Calculate average risk score
        const avgRiskScore = Math.round(
            results.reduce((sum, r) => sum + r.result.riskScore, 0) / totalCount
        );

        // Determine consensus
        const isSafe = riskyCount === 0 && avgRiskScore < 50;
        const hasConsensus = totalCount >= 2; // Simplified consensus

        if (hasConsensus) {
            intent.status = isSafe ? 'approved' : 'blocked';
            intent.consensus = {
                isSafe,
                avgRiskScore,
                riskyCount,
                totalCount,
                timestamp: Date.now()
            };

            // Store final result
            this.verificationResults.set(intentId, {
                intentId,
                status: intent.status,
                consensus: intent.consensus,
                results: intent.results,
                analysisTime: Date.now() - intent.startTime
            });

            console.log(`🎯 Consensus reached for ${intentId}: ${intent.status.toUpperCase()}`);
            this.emit('consensusReached', { 
                intentId, 
                status: intent.status, 
                consensus: intent.consensus 
            });
        }
    }

    /**
     * Get verification status for an intent
     */
    getVerificationStatus(intentId) {
        const active = this.activeIntents.get(intentId);
        const completed = this.verificationResults.get(intentId);

        if (completed) {
            return {
                intentId,
                status: 'completed',
                result: completed.status,
                consensus: completed.consensus,
                analysisTime: completed.analysisTime,
                simulatorCount: completed.results.length
            };
        }

        if (active) {
            return {
                intentId,
                status: active.status,
                simulatorCount: active.results.length,
                requiredSimulators: 2,
                progress: Math.min((active.results.length / 2) * 100, 100),
                results: active.results.map(r => ({
                    simulatorId: r.simulatorId,
                    riskScore: r.result.riskScore,
                    isRisky: r.result.isRisky,
                    timestamp: r.timestamp
                }))
            };
        }

        return {
            intentId,
            status: 'not_found',
            message: 'Intent not found in verification system'
        };
    }

    /**
     * Get all active verifications
     */
    getActiveVerifications() {
        const active = [];
        
        for (const [intentId, intent] of this.activeIntents.entries()) {
            if (intent.status === 'analyzing') {
                active.push({
                    intentId,
                    simulatorCount: intent.results.length,
                    progress: Math.min((intent.results.length / 2) * 100, 100),
                    startTime: intent.startTime,
                    elapsedTime: Date.now() - intent.startTime
                });
            }
        }

        return active;
    }

    /**
     * Get recent completions
     */
    getRecentCompletions(limit = 10) {
        const completions = Array.from(this.verificationResults.values())
            .sort((a, b) => b.consensus.timestamp - a.consensus.timestamp)
            .slice(0, limit);

        return completions.map(c => ({
            intentId: c.intentId,
            status: c.status,
            riskScore: c.consensus.avgRiskScore,
            analysisTime: c.analysisTime,
            timestamp: c.consensus.timestamp,
            simulatorCount: c.results.length
        }));
    }

    /**
     * Get simulator statuses
     */
    getSimulatorStatuses() {
        const statuses = [];
        
        for (const [id, simulator] of this.simulators.entries()) {
            statuses.push({
                id,
                ...simulator.getStatus()
            });
        }

        return statuses;
    }

    /**
     * Get manager metrics
     */
    getMetrics() {
        const simulatorMetrics = Array.from(this.simulators.values())
            .map(s => s.getMetrics());

        return {
            manager: {
                ...this.metrics,
                uptime: Date.now() - this.metrics.startTime,
                activeIntents: this.activeIntents.size,
                completedVerifications: this.verificationResults.size
            },
            simulators: simulatorMetrics,
            summary: {
                totalAnalyzed: simulatorMetrics.reduce((sum, m) => sum + m.totalAnalyzed, 0),
                totalThreats: simulatorMetrics.reduce((sum, m) => sum + m.threatsDetected, 0),
                avgRiskScore: Math.round(
                    simulatorMetrics.reduce((sum, m) => sum + m.avgRiskScore, 0) / 
                    simulatorMetrics.length
                ) || 0
            }
        };
    }

    /**
     * Stop all simulators
     */
    async stop() {
        console.log('🛑 Stopping all simulators...');
        
        for (const [id, simulator] of this.simulators.entries()) {
            simulator.stop();
            this.metrics.activeSimulators--;
            console.log(`🛑 Stopped simulator: ${id}`);
        }

        this.simulators.clear();
        console.log('✅ All simulators stopped');
    }

    /**
     * Restart a specific simulator
     */
    async restartSimulator(id) {
        const simulator = this.simulators.get(id);
        if (simulator) {
            simulator.stop();
            this.simulators.delete(id);
            this.metrics.activeSimulators--;
            
            // Recreate with same config
            await this.createSimulator(id, simulator.config);
        }
    }

    /**
     * Get system health
     */
    getHealth() {
        const activeCount = this.metrics.activeSimulators;
        const requiredCount = 2; // Minimum required simulators
        
        return {
            status: activeCount >= requiredCount ? 'healthy' : 'degraded',
            activeSimulators: activeCount,
            requiredSimulators: requiredCount,
            uptime: Date.now() - this.metrics.startTime,
            lastActivity: Math.max(...Array.from(this.simulators.values())
                .map(s => s.metrics.lastAnalysis || 0))
        };
    }
}