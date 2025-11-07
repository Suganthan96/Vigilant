import { ethers } from 'ethers';
import { EventEmitter } from 'events';

/**
 * Vigilant Simulator Node
 * 
 * Listens to IntentSubmitted events via Somnia Data Streams
 * Analyzes transaction safety and submits verification results
 */
export class VigilantSimulator extends EventEmitter {
    constructor(config) {
        super();
        
        this.config = config;
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        this.contract = null;
        this.isRunning = false;
        this.processedIntents = new Set();
        
        // Simulation metrics
        this.metrics = {
            totalAnalyzed: 0,
            threatsDetected: 0,
            avgRiskScore: 0,
            uptime: Date.now()
        };
    }

    /**
     * Initialize the simulator with contract ABI and address
     */
    async initialize(contractAddress, contractABI) {
        try {
            this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
            
            // Register as authorized simulator
            console.log('🔧 Registering as authorized simulator...');
            const tx = await this.contract.addSimulator(this.wallet.address);
            await tx.wait();
            
            console.log('✅ Simulator registered:', this.wallet.address);
            console.log('💰 Balance:', ethers.formatEther(await this.wallet.provider.getBalance(this.wallet.address)), 'tokens');
            
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

        console.log('🚀 Starting Vigilant Simulator...');
        console.log('👛 Simulator Address:', this.wallet.address);
        
        this.isRunning = true;
        
        // Listen for IntentSubmitted events
        this.contract.on('IntentSubmitted', async (intentId, user, target, stateSnapshot, timestamp, event) => {
            await this.handleIntentSubmitted({
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
        this.emit('started');
    }

    /**
     * Stop the simulator
     */
    stop() {
        if (!this.isRunning) return;
        
        console.log('🛑 Stopping Vigilant Simulator...');
        this.contract.removeAllListeners('IntentSubmitted');
        this.isRunning = false;
        this.emit('stopped');
    }

    /**
     * Handle new intent submission
     */
    async handleIntentSubmitted(intentData) {
        const { intentId, user, target, stateSnapshot, timestamp } = intentData;
        
        // Skip if already processed
        if (this.processedIntents.has(intentId)) {
            return;
        }
        
        console.log('\n🔍 New Intent Detected:');
        console.log('📋 Intent ID:', intentId);
        console.log('👤 User:', user);
        console.log('🎯 Target:', target);
        console.log('📸 State Snapshot:', stateSnapshot);
        
        this.processedIntents.add(intentId);
        this.emit('intentReceived', intentData);
        
        try {
            // Get full intent details from contract
            const intent = await this.contract.getIntent(intentId);
            
            // Perform comprehensive analysis
            const analysisResult = await this.analyzeIntent(intent, intentData);
            
            // Submit verification result to contract
            await this.submitVerificationResult(intentId, analysisResult);
            
            this.metrics.totalAnalyzed++;
            if (analysisResult.isRisky) {
                this.metrics.threatsDetected++;
            }
            
            this.emit('intentAnalyzed', { intentId, result: analysisResult });
            
        } catch (error) {
            console.error('❌ Failed to analyze intent:', intentId, error.message);
            this.emit('analysisError', { intentId, error: error.message });
        }
    }

    /**
     * Comprehensive intent analysis
     */
    async analyzeIntent(intent, metadata) {
        console.log('🔬 Starting comprehensive analysis...');
        
        const analysis = {
            intentId: metadata.intentId,
            layers: {
                basicSimulation: await this.performBasicSimulation(intent),
                mempoolAnalysis: await this.analyzeMempoolThreats(intent),
                patternMatching: await this.analyzePatterns(intent),
                behavioralAnalysis: await this.analyzeBehavior(intent),
                approvalCheck: await this.checkApprovals(intent)
            },
            timestamp: Date.now()
        };

        // Calculate overall risk score
        const riskScore = this.calculateRiskScore(analysis.layers);
        const isRisky = riskScore > 50;

        console.log('📊 Analysis Results:');
        console.log('   Basic Simulation:', analysis.layers.basicSimulation.risk);
        console.log('   Mempool Analysis:', analysis.layers.mempoolAnalysis.risk);
        console.log('   Pattern Matching:', analysis.layers.patternMatching.risk);
        console.log('   Behavioral Analysis:', analysis.layers.behavioralAnalysis.risk);
        console.log('   Approval Check:', analysis.layers.approvalCheck.risk);
        console.log('🎯 Overall Risk Score:', riskScore);
        console.log('⚠️ Is Risky:', isRisky);

        return {
            isRisky,
            riskScore,
            analysis,
            detectedThreats: this.extractThreats(analysis.layers),
            recommendation: isRisky ? 'BLOCK' : 'APPROVE'
        };
    }

    /**
     * Layer 1: Basic transaction simulation
     */
    async performBasicSimulation(intent) {
        console.log('   🔍 Basic Simulation...');
        
        try {
            // Simulate the transaction call
            const result = await this.provider.call({
                to: intent.target,
                data: intent.callData,
                value: intent.value,
                from: intent.user
            });

            // Check for revert
            if (result === '0x') {
                return { risk: 30, reason: 'Transaction may revert' };
            }

            // Basic success
            return { risk: 10, reason: 'Basic simulation passed' };
            
        } catch (error) {
            if (error.message.includes('revert')) {
                return { risk: 80, reason: 'Transaction reverts: ' + error.message };
            }
            return { risk: 40, reason: 'Simulation failed: ' + error.message };
        }
    }

    /**
     * Layer 2: Mempool threat analysis
     */
    async analyzeMempoolThreats(intent) {
        console.log('   🕵️ Mempool Analysis...');
        
        // Check for suspicious patterns in mempool
        const threats = [];
        let risk = 0;

        // Check for MEV opportunities
        if (this.detectMEVOpportunity(intent)) {
            threats.push('MEV_OPPORTUNITY');
            risk += 20;
        }

        // Check for sandwich attack setup
        if (this.detectSandwichSetup(intent)) {
            threats.push('SANDWICH_ATTACK');
            risk += 30;
        }

        // Check for front-running potential
        if (this.detectFrontRunning(intent)) {
            threats.push('FRONT_RUNNING');
            risk += 25;
        }

        return { 
            risk: Math.min(risk, 100), 
            threats,
            reason: threats.length > 0 ? `Detected: ${threats.join(', ')}` : 'No mempool threats detected'
        };
    }

    /**
     * Layer 3: Pattern matching against known threats
     */
    async analyzePatterns(intent) {
        console.log('   🎯 Pattern Matching...');
        
        const threats = [];
        let risk = 0;

        // Check function signatures against threat database
        const functionSelector = intent.callData.slice(0, 10);
        
        // Known dangerous function signatures
        const dangerousFunctions = {
            '0xa9059cbb': { name: 'transfer', risk: 15 },
            '0x095ea7b3': { name: 'approve', risk: 25 },
            '0x23b872dd': { name: 'transferFrom', risk: 20 },
            '0x2e1a7d4d': { name: 'withdraw', risk: 30 },
            '0xd0e30db0': { name: 'deposit', risk: 10 }
        };

        if (dangerousFunctions[functionSelector]) {
            const func = dangerousFunctions[functionSelector];
            threats.push(`DANGEROUS_FUNCTION_${func.name.toUpperCase()}`);
            risk += func.risk;
        }

        // Check for honeypot patterns
        if (await this.detectHoneypotPattern(intent)) {
            threats.push('HONEYPOT_PATTERN');
            risk += 60;
        }

        // Check for approval exploits
        if (await this.detectApprovalExploit(intent)) {
            threats.push('APPROVAL_EXPLOIT');
            risk += 70;
        }

        return { 
            risk: Math.min(risk, 100), 
            threats,
            reason: threats.length > 0 ? `Pattern threats: ${threats.join(', ')}` : 'No dangerous patterns detected'
        };
    }

    /**
     * Layer 4: Behavioral analysis
     */
    async analyzeBehavior(intent) {
        console.log('   🧠 Behavioral Analysis...');
        
        let risk = 0;
        const behaviors = [];

        // Check contract age
        const code = await this.provider.getCode(intent.target);
        if (code === '0x') {
            behaviors.push('EOA_TARGET');
            risk += 5;
        }

        // Check for unusual gas patterns
        if (intent.value > ethers.parseEther('1')) {
            behaviors.push('HIGH_VALUE_TRANSFER');
            risk += 15;
        }

        // Check for time-sensitive operations
        if (intent.deadline - intent.timestamp < 300) { // Less than 5 minutes
            behaviors.push('TIME_SENSITIVE');
            risk += 10;
        }

        return { 
            risk: Math.min(risk, 100), 
            behaviors,
            reason: behaviors.length > 0 ? `Behaviors: ${behaviors.join(', ')}` : 'Normal behavior patterns'
        };
    }

    /**
     * Layer 5: Approval and permission checks
     */
    async checkApprovals(intent) {
        console.log('   🔐 Approval Check...');
        
        let risk = 0;
        const issues = [];

        // Check if this is an approval transaction
        if (intent.callData.startsWith('0x095ea7b3')) { // approve function
            const spender = '0x' + intent.callData.slice(34, 74);
            const amount = '0x' + intent.callData.slice(74, 138);
            
            // Check for unlimited approvals
            if (amount === '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') {
                issues.push('UNLIMITED_APPROVAL');
                risk += 40;
            }

            // Check spender reputation (simplified)
            if (await this.isKnownMaliciousAddress(spender)) {
                issues.push('MALICIOUS_SPENDER');
                risk += 80;
            }
        }

        return { 
            risk: Math.min(risk, 100), 
            issues,
            reason: issues.length > 0 ? `Approval issues: ${issues.join(', ')}` : 'No approval issues detected'
        };
    }

    /**
     * Calculate overall risk score from all analysis layers
     */
    calculateRiskScore(layers) {
        const weights = {
            basicSimulation: 0.2,
            mempoolAnalysis: 0.2,
            patternMatching: 0.3,
            behavioralAnalysis: 0.15,
            approvalCheck: 0.15
        };

        let totalRisk = 0;
        for (const [layer, weight] of Object.entries(weights)) {
            totalRisk += layers[layer].risk * weight;
        }

        return Math.round(totalRisk);
    }

    /**
     * Extract all detected threats from analysis layers
     */
    extractThreats(layers) {
        const allThreats = [];
        
        if (layers.mempoolAnalysis.threats) {
            allThreats.push(...layers.mempoolAnalysis.threats);
        }
        if (layers.patternMatching.threats) {
            allThreats.push(...layers.patternMatching.threats);
        }
        if (layers.behavioralAnalysis.behaviors) {
            allThreats.push(...layers.behavioralAnalysis.behaviors);
        }
        if (layers.approvalCheck.issues) {
            allThreats.push(...layers.approvalCheck.issues);
        }

        return allThreats;
    }

    /**
     * Submit verification result to the contract
     */
    async submitVerificationResult(intentId, analysisResult) {
        try {
            console.log('📤 Submitting verification result...');
            
            const tx = await this.contract.submitSimulation(
                intentId,
                analysisResult.isRisky,
                analysisResult.riskScore
            );

            console.log('⏳ Transaction submitted:', tx.hash);
            const receipt = await tx.wait();
            
            console.log('✅ Verification result submitted successfully');
            console.log('📋 Transaction Hash:', receipt.hash);
            console.log('⛽ Gas Used:', receipt.gasUsed.toString());
            
            return receipt;
            
        } catch (error) {
            console.error('❌ Failed to submit verification result:', error.message);
            throw error;
        }
    }

    // Threat detection helper methods
    detectMEVOpportunity(intent) {
        // Simplified MEV detection
        return intent.callData.includes('swap') || intent.callData.includes('exchange');
    }

    detectSandwichSetup(intent) {
        // Check for DEX interactions that could be sandwiched
        const dexSelectors = ['0x38ed1739', '0x7ff36ab5', '0x18cbafe5']; // swapExactTokensForTokens, etc.
        return dexSelectors.some(selector => intent.callData.startsWith(selector));
    }

    detectFrontRunning(intent) {
        // Check for time-sensitive or price-sensitive operations
        return intent.deadline - intent.timestamp < 60; // Less than 1 minute
    }

    async detectHoneypotPattern(intent) {
        // Simplified honeypot detection
        try {
            const code = await this.provider.getCode(intent.target);
            // Look for suspicious patterns in bytecode
            return code.includes('selfdestruct') || code.length > 10000;
        } catch {
            return false;
        }
    }

    async detectApprovalExploit(intent) {
        // Check for approval exploit patterns
        return intent.callData.startsWith('0x095ea7b3') && intent.value > 0;
    }

    async isKnownMaliciousAddress(address) {
        // Simplified malicious address check
        const knownMalicious = [
            '0x0000000000000000000000000000000000000000',
            // Add more known malicious addresses
        ];
        return knownMalicious.includes(address.toLowerCase());
    }

    /**
     * Get simulator metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.metrics.uptime,
            isRunning: this.isRunning,
            address: this.wallet.address
        };
    }
}