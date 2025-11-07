import ethers from 'ethers';
import { EventEmitter } from 'events';

/**
 * Vigilant Simulator Service
 * 
 * Focuses on SST (Transaction Simulation Spoofing) Protection:
 * - State verification
 * - Honeypot detection  
 * - Approval exploits
 * - Malicious contract patterns
 */
export class SimulatorService extends EventEmitter {
    constructor(config) {
        super();
        
        this.config = config;
        this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        this.contract = null;
        this.isRunning = false;
        this.processedIntents = new Set();
        
        // Simulation metrics
        this.metrics = {
            totalAnalyzed: 0,
            threatsDetected: 0,
            avgRiskScore: 0,
            startTime: Date.now(),
            lastAnalysis: null
        };

        this.simulatorId = `SIM-${Date.now().toString(36)}`;
    }

    /**
     * Initialize the simulator with contract
     */
    async initialize(contractAddress, contractABI) {
        try {
            this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
            
            console.log('🔧 Initializing Vigilant Simulator...');
            console.log('🆔 Simulator ID:', this.simulatorId);
            console.log('👛 Address:', this.wallet.address);
            
            // Check if already authorized
            const isAuthorized = await this.contract.authorizedSimulators(this.wallet.address);
            
            if (!isAuthorized) {
                console.log('📝 Registering as authorized simulator...');
                const tx = await this.contract.addSimulator(this.wallet.address);
                await tx.wait();
                console.log('✅ Simulator registered successfully');
            } else {
                console.log('✅ Already authorized simulator');
            }
            
            const balance = await this.wallet.provider.getBalance(this.wallet.address);
            console.log('💰 Balance:', ethers.utils.formatEther(balance), 'tokens');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize simulator:', error.message);
            return false;
        }
    }

    /**
     * Start listening for IntentSubmitted events
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Simulator already running');
            return;
        }

        console.log('🚀 Starting Vigilant Simulator Service...');
        this.isRunning = true;
        
        // Listen for IntentSubmitted events
        this.contract.on('IntentSubmitted', async (intentId, user, target, stateSnapshot, timestamp, event) => {
            await this.handleNewIntent({
                intentId,
                user,
                target,
                stateSnapshot,
                timestamp,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            });
        });

        console.log('👂 Listening for IntentSubmitted events...');
        this.emit('started', { simulatorId: this.simulatorId });
    }

    /**
     * Stop the simulator
     */
    stop() {
        if (!this.isRunning) return;
        
        console.log('🛑 Stopping Vigilant Simulator...');
        this.contract.removeAllListeners('IntentSubmitted');
        this.isRunning = false;
        this.emit('stopped', { simulatorId: this.simulatorId });
    }

    /**
     * Handle new intent submission
     */
    async handleNewIntent(intentData) {
        const { intentId, user, target, stateSnapshot } = intentData;
        
        // Skip if already processed
        if (this.processedIntents.has(intentId)) {
            return;
        }
        
        console.log('\n🔍 New Intent Received:');
        console.log('📋 Intent ID:', intentId);
        console.log('👤 User:', user);
        console.log('🎯 Target Contract:', target);
        console.log('📸 State Snapshot:', stateSnapshot);
        
        this.processedIntents.add(intentId);
        this.emit('intentReceived', { intentId, ...intentData });
        
        try {
            // Get full intent details from contract
            const intent = await this.contract.getIntent(intentId);
            
            // Perform SST-focused analysis
            const analysisResult = await this.performSSTAnalysis(intent, intentData);
            
            // Submit verification result
            await this.submitVerification(intentId, analysisResult);
            
            // Update metrics
            this.updateMetrics(analysisResult);
            
            this.emit('intentAnalyzed', { 
                intentId, 
                result: analysisResult,
                simulatorId: this.simulatorId 
            });
            
        } catch (error) {
            console.error('❌ Analysis failed for intent:', intentId, error.message);
            this.emit('analysisError', { 
                intentId, 
                error: error.message,
                simulatorId: this.simulatorId 
            });
        }
    }

    /**
     * SST-focused analysis
     */
    async performSSTAnalysis(intent, metadata) {
        console.log('🔬 Starting SST Analysis...');
        
        const startTime = Date.now();
        
        const analysis = {
            intentId: metadata.intentId,
            simulatorId: this.simulatorId,
            timestamp: startTime,
            layers: {
                stateVerification: await this.verifyStateIntegrity(intent, metadata),
                honeypotDetection: await this.detectHoneypot(intent),
                approvalAnalysis: await this.analyzeApprovals(intent),
                contractAnalysis: await this.analyzeContract(intent),
                behaviorAnalysis: await this.analyzeBehavior(intent)
            }
        };

        // Calculate risk score
        const riskScore = this.calculateRiskScore(analysis.layers);
        const isRisky = riskScore > 50;
        
        const analysisTime = Date.now() - startTime;
        
        console.log('📊 SST Analysis Results:');
        console.log('   State Verification:', analysis.layers.stateVerification.risk);
        console.log('   Honeypot Detection:', analysis.layers.honeypotDetection.risk);
        console.log('   Approval Analysis:', analysis.layers.approvalAnalysis.risk);
        console.log('   Contract Analysis:', analysis.layers.contractAnalysis.risk);
        console.log('   Behavior Analysis:', analysis.layers.behaviorAnalysis.risk);
        console.log('🎯 Overall Risk Score:', riskScore);
        console.log('⚠️ Is Risky:', isRisky);
        console.log('⏱️ Analysis Time:', analysisTime + 'ms');

        return {
            isRisky,
            riskScore,
            analysis,
            detectedThreats: this.extractThreats(analysis.layers),
            recommendation: isRisky ? 'BLOCK' : 'APPROVE',
            analysisTime,
            simulatorId: this.simulatorId
        };
    }

    /**
     * Layer 1: State verification (Core SST protection)
     */
    async verifyStateIntegrity(intent, metadata) {
        console.log('   🔍 State Verification...');
        
        try {
            // Capture current state
            const currentStateSnapshot = await this.captureStateSnapshot(intent.target);
            
            // Compare with stored state
            if (currentStateSnapshot !== metadata.stateSnapshot) {
                return {
                    risk: 90,
                    reason: 'State changed since intent creation - potential SST attack',
                    details: {
                        originalState: metadata.stateSnapshot,
                        currentState: currentStateSnapshot,
                        stateChanged: true
                    }
                };
            }

            // Simulate transaction to check for state manipulation
            const simulationResult = await this.simulateTransaction(intent);
            
            return {
                risk: simulationResult.risk,
                reason: simulationResult.reason,
                details: {
                    stateChanged: false,
                    simulationPassed: simulationResult.success
                }
            };
            
        } catch (error) {
            return {
                risk: 60,
                reason: 'State verification failed: ' + error.message,
                details: { error: error.message }
            };
        }
    }

    /**
     * Layer 2: Honeypot detection
     */
    async detectHoneypot(intent) {
        console.log('   🍯 Honeypot Detection...');
        
        let risk = 0;
        const threats = [];
        
        try {
            // Check contract code for honeypot patterns
            const code = await this.provider.getCode(intent.target);
            
            if (code === '0x') {
                // EOA target - generally safe
                return { risk: 5, threats: [], reason: 'Target is EOA' };
            }

            // Check for suspicious patterns in bytecode
            if (code.includes('selfdestruct')) {
                threats.push('SELFDESTRUCT_PRESENT');
                risk += 40;
            }

            // Check for unusual contract size (potential obfuscation)
            if (code.length > 20000) {
                threats.push('LARGE_CONTRACT');
                risk += 20;
            }

            // Check for potential honeypot function signatures
            const honeypotSignatures = [
                '0x70a08231', // balanceOf - often manipulated in honeypots
                '0x18160ddd', // totalSupply - can be manipulated
            ];

            for (const sig of honeypotSignatures) {
                if (code.includes(sig.slice(2))) {
                    threats.push('HONEYPOT_SIGNATURE');
                    risk += 15;
                }
            }

            return {
                risk: Math.min(risk, 100),
                threats,
                reason: threats.length > 0 ? `Honeypot indicators: ${threats.join(', ')}` : 'No honeypot patterns detected'
            };
            
        } catch (error) {
            return {
                risk: 30,
                threats: ['ANALYSIS_FAILED'],
                reason: 'Honeypot analysis failed: ' + error.message
            };
        }
    }

    /**
     * Layer 3: Approval analysis
     */
    async analyzeApprovals(intent) {
        console.log('   🔐 Approval Analysis...');
        
        let risk = 0;
        const issues = [];
        
        // Check if this is an approval transaction
        if (intent.callData.startsWith('0x095ea7b3')) { // approve function
            try {
                const spender = '0x' + intent.callData.slice(34, 74);
                const amount = '0x' + intent.callData.slice(74, 138);
                
                // Check for unlimited approvals
                if (amount === '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') {
                    issues.push('UNLIMITED_APPROVAL');
                    risk += 50;
                }

                // Check if spender is a contract
                const spenderCode = await this.provider.getCode(spender);
                if (spenderCode !== '0x') {
                    issues.push('CONTRACT_SPENDER');
                    risk += 20;
                }

                // Check for zero address approval
                if (spender === '0x0000000000000000000000000000000000000000') {
                    issues.push('ZERO_ADDRESS_APPROVAL');
                    risk += 80;
                }

            } catch (error) {
                issues.push('APPROVAL_ANALYSIS_FAILED');
                risk += 30;
            }
        }

        return {
            risk: Math.min(risk, 100),
            issues,
            reason: issues.length > 0 ? `Approval issues: ${issues.join(', ')}` : 'No approval issues detected'
        };
    }

    /**
     * Layer 4: Contract analysis
     */
    async analyzeContract(intent) {
        console.log('   📋 Contract Analysis...');
        
        let risk = 0;
        const findings = [];
        
        try {
            // Analyze function selector
            const functionSelector = intent.callData.slice(0, 10);
            
            // Known risky function signatures
            const riskyFunctions = {
                '0x2e1a7d4d': { name: 'withdraw', risk: 30 },
                '0xa9059cbb': { name: 'transfer', risk: 20 },
                '0x23b872dd': { name: 'transferFrom', risk: 25 },
                '0x095ea7b3': { name: 'approve', risk: 35 }
            };

            if (riskyFunctions[functionSelector]) {
                const func = riskyFunctions[functionSelector];
                findings.push(`RISKY_FUNCTION_${func.name.toUpperCase()}`);
                risk += func.risk;
            }

            // Check transaction value
            if (intent.value > ethers.utils.parseEther('0.1')) {
                findings.push('HIGH_VALUE_TRANSACTION');
                risk += 15;
            }

            return {
                risk: Math.min(risk, 100),
                findings,
                reason: findings.length > 0 ? `Contract findings: ${findings.join(', ')}` : 'Contract analysis passed'
            };
            
        } catch (error) {
            return {
                risk: 25,
                findings: ['CONTRACT_ANALYSIS_FAILED'],
                reason: 'Contract analysis failed: ' + error.message
            };
        }
    }

    /**
     * Layer 5: Behavior analysis
     */
    async analyzeBehavior(intent) {
        console.log('   🧠 Behavior Analysis...');
        
        let risk = 0;
        const behaviors = [];

        // Check timing patterns
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = intent.deadline - currentTime;
        
        if (timeDiff < 60) { // Less than 1 minute
            behaviors.push('URGENT_DEADLINE');
            risk += 20;
        }

        // Check for unusual gas limit patterns
        if (intent.callData.length > 1000) {
            behaviors.push('LARGE_CALLDATA');
            risk += 10;
        }

        return {
            risk: Math.min(risk, 100),
            behaviors,
            reason: behaviors.length > 0 ? `Behaviors: ${behaviors.join(', ')}` : 'Normal behavior patterns'
        };
    }

    /**
     * Helper: Capture state snapshot
     */
    async captureStateSnapshot(target) {
        const balance = await this.provider.getBalance(target);
        const code = await this.provider.getCode(target);
        const blockNumber = await this.provider.getBlockNumber();
        
        return ethers.utils.keccak256(
            ethers.utils.solidityPack(
                ['uint256', 'uint256', 'uint256'],
                [balance, code.length, blockNumber - 1]
            )
        );
    }

    /**
     * Helper: Simulate transaction
     */
    async simulateTransaction(intent) {
        try {
            const result = await this.provider.call({
                to: intent.target,
                data: intent.callData,
                value: intent.value,
                from: intent.user
            });

            return {
                success: true,
                risk: 10,
                reason: 'Transaction simulation successful',
                result
            };
            
        } catch (error) {
            if (error.message.includes('revert')) {
                return {
                    success: false,
                    risk: 70,
                    reason: 'Transaction would revert: ' + error.message
                };
            }
            
            return {
                success: false,
                risk: 40,
                reason: 'Simulation failed: ' + error.message
            };
        }
    }

    /**
     * Calculate overall risk score
     */
    calculateRiskScore(layers) {
        const weights = {
            stateVerification: 0.4,  // Highest weight for SST protection
            honeypotDetection: 0.25,
            approvalAnalysis: 0.2,
            contractAnalysis: 0.1,
            behaviorAnalysis: 0.05
        };

        let totalRisk = 0;
        for (const [layer, weight] of Object.entries(weights)) {
            totalRisk += layers[layer].risk * weight;
        }

        return Math.round(totalRisk);
    }

    /**
     * Extract all detected threats
     */
    extractThreats(layers) {
        const allThreats = [];
        
        Object.values(layers).forEach(layer => {
            if (layer.threats) allThreats.push(...layer.threats);
            if (layer.issues) allThreats.push(...layer.issues);
            if (layer.findings) allThreats.push(...layer.findings);
            if (layer.behaviors) allThreats.push(...layer.behaviors);
        });

        return allThreats;
    }

    /**
     * Submit verification result to contract
     */
    async submitVerification(intentId, analysisResult) {
        try {
            console.log('📤 Submitting verification result...');
            
            const tx = await this.contract.submitSimulation(
                intentId,
                analysisResult.isRisky,
                analysisResult.riskScore
            );

            console.log('⏳ Transaction hash:', tx.hash);
            const receipt = await tx.wait();
            
            console.log('✅ Verification submitted successfully');
            console.log('⛽ Gas used:', receipt.gasUsed.toString());
            
            return receipt;
            
        } catch (error) {
            console.error('❌ Failed to submit verification:', error.message);
            throw error;
        }
    }

    /**
     * Update metrics
     */
    updateMetrics(analysisResult) {
        this.metrics.totalAnalyzed++;
        if (analysisResult.isRisky) {
            this.metrics.threatsDetected++;
        }
        
        // Update average risk score
        this.metrics.avgRiskScore = Math.round(
            (this.metrics.avgRiskScore * (this.metrics.totalAnalyzed - 1) + analysisResult.riskScore) / 
            this.metrics.totalAnalyzed
        );
        
        this.metrics.lastAnalysis = Date.now();
    }

    /**
     * Get simulator metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.metrics.startTime,
            isRunning: this.isRunning,
            address: this.wallet.address,
            simulatorId: this.simulatorId
        };
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            simulatorId: this.simulatorId,
            address: this.wallet.address,
            isRunning: this.isRunning,
            metrics: this.getMetrics()
        };
    }
}