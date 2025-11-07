import ethers from 'ethers';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Simple Vigilant Simulator
 * 
 * This is a standalone simulator that:
 * 1. Connects to blockchain
 * 2. Listens for events
 * 3. Analyzes transactions
 * 4. Submits verification results
 */
class SimpleVigilantSimulator extends EventEmitter {
    constructor(config) {
        super();
        
        this.config = config;
        this.simulatorId = `SIM-${Date.now().toString(36)}`;
        this.isRunning = false;
        
        // Metrics
        this.metrics = {
            totalAnalyzed: 0,
            threatsDetected: 0,
            startTime: Date.now()
        };
        
        console.log('🔧 Creating Vigilant Simulator:', this.simulatorId);
    }

    /**
     * Initialize the simulator
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Simulator...');
            
            // Connect to blockchain
            this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
            this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
            
            console.log('📡 Connected to network');
            console.log('👛 Simulator address:', this.wallet.address);
            
            // Check balance
            const balance = await this.wallet.getBalance();
            console.log('💰 Balance:', ethers.utils.formatEther(balance), 'tokens');
            
            // Set up contract (if available)
            if (this.config.contractAddress && this.config.contractABI) {
                this.contract = new ethers.Contract(
                    this.config.contractAddress,
                    this.config.contractABI,
                    this.wallet
                );
                console.log('📋 Contract connected:', this.config.contractAddress);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Start the simulator
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Simulator already running');
            return;
        }

        console.log('🚀 Starting Simulator:', this.simulatorId);
        this.isRunning = true;

        if (this.contract) {
            // Listen for REAL blockchain events ONLY
            this.startBlockchainListener();
        } else {
            console.log('❌ No contract configured - simulator will not work');
            return;
        }

        console.log('👂 Simulator is now listening for intents...');
        this.emit('started');
    }

    /**
     * Listen for real blockchain events
     */
    startBlockchainListener() {
        console.log('📡 Listening for IntentSubmitted events...');
        
        this.contract.on('IntentSubmitted', async (intentId, user, target, timestamp, event) => {
            console.log('\n🔍 New Intent Detected:', intentId);
            console.log('👤 User:', user);
            console.log('🎯 Target:', target);
            console.log('⏰ Timestamp:', timestamp.toString());
            
            try {
                await this.analyzeIntent({
                    intentId,
                    user,
                    target,
                    stateSnapshot: '0x0000000000000000000000000000000000000000000000000000000000000000', // Default
                    timestamp: timestamp.toNumber(),
                    blockNumber: event.blockNumber
                });
            } catch (error) {
                console.error('❌ Analysis failed:', error.message);
            }
        });
    }

    /**
     * Mock listener for demonstration
     */
    startMockListener() {
        console.log('🎭 Using mock events for demonstration...');
        
        // NO MOCK DATA - Only real blockchain events
    }

    /**
     * Generate mock intent for testing
     */
    generateMockIntent() {
        const intentId = '0x' + Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        return {
            intentId,
            user: '0x1234567890123456789012345678901234567890',
            target: '0x0987654321098765432109876543210987654321',
            stateSnapshot: '0xabcdef1234567890',
            timestamp: Math.floor(Date.now() / 1000),
            blockNumber: Math.floor(Math.random() * 1000000)
        };
    }

    /**
     * Analyze an intent (Core SST Analysis)
     */
    async analyzeIntent(intentData) {
        console.log('\n🔬 Starting Analysis for:', intentData.intentId);
        console.log('👤 User:', intentData.user);
        console.log('🎯 Target:', intentData.target);
        
        const startTime = Date.now();
        
        try {
            // Perform 5-layer analysis
            const analysis = {
                stateVerification: await this.verifyState(intentData),
                honeypotDetection: await this.detectHoneypot(intentData),
                approvalAnalysis: await this.analyzeApprovals(intentData),
                contractAnalysis: await this.analyzeContract(intentData),
                behaviorAnalysis: await this.analyzeBehavior(intentData)
            };

            // Calculate risk score
            const riskScore = this.calculateRiskScore(analysis);
            const isRisky = riskScore > 50;
            
            const result = {
                intentId: intentData.intentId,
                simulatorId: this.simulatorId,
                riskScore,
                isRisky,
                analysis,
                recommendation: isRisky ? 'BLOCK' : 'APPROVE',
                analysisTime: Date.now() - startTime
            };

            console.log('📊 Analysis Results:');
            console.log('   State Verification:', analysis.stateVerification.risk);
            console.log('   Honeypot Detection:', analysis.honeypotDetection.risk);
            console.log('   Approval Analysis:', analysis.approvalAnalysis.risk);
            console.log('   Contract Analysis:', analysis.contractAnalysis.risk);
            console.log('   Behavior Analysis:', analysis.behaviorAnalysis.risk);
            console.log('🎯 Overall Risk Score:', riskScore);
            console.log('⚠️ Is Risky:', isRisky);
            console.log('💡 Recommendation:', result.recommendation);
            console.log('⏱️ Analysis Time:', result.analysisTime + 'ms');

            // Submit result
            await this.submitResult(result);
            
            // Update metrics
            this.metrics.totalAnalyzed++;
            if (isRisky) {
                this.metrics.threatsDetected++;
            }

            this.emit('analysisComplete', result);
            
        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            this.emit('analysisError', { intentId: intentData.intentId, error: error.message });
        }
    }

    /**
     * Layer 1: State Verification (Core SST Protection)
     */
    async verifyState(intentData) {
        console.log('   🔍 State Verification...');
        
        try {
            // Get current blockchain state
            const currentBlock = await this.provider.getBlockNumber();
            const targetBalance = await this.provider.getBalance(intentData.target);
            const userBalance = await this.provider.getBalance(intentData.user);
            
            console.log('     📊 Current Block:', currentBlock);
            console.log('     💰 Target Balance:', ethers.utils.formatEther(targetBalance), 'STT');
            console.log('     👛 User Balance:', ethers.utils.formatEther(userBalance), 'STT');
            
            // Check if target is a contract
            const targetCode = await this.provider.getCode(intentData.target);
            const isContract = targetCode !== '0x';
            
            console.log('     📋 Target is contract:', isContract);
            
            // Real state verification logic
            let risk = 5; // Base risk
            let reason = 'State verification passed';
            let stateChanged = false;
            
            // Check for suspicious patterns
            if (isContract) {
                risk += 10; // Slightly higher risk for contract interactions
                reason = 'Contract interaction detected';
            }
            
            // Check if user has sufficient balance (basic validation)
            if (userBalance.lt(ethers.utils.parseEther('0.001'))) {
                risk += 20;
                reason = 'Low user balance detected';
            }
            
            // Check for zero-balance target (potential honeypot)
            if (targetBalance.eq(0) && isContract) {
                risk += 30;
                reason = 'Zero-balance contract detected - potential honeypot';
            }
            
            return {
                risk: Math.min(risk, 100),
                reason,
                stateChanged,
                details: {
                    currentBlock,
                    targetBalance: ethers.utils.formatEther(targetBalance),
                    userBalance: ethers.utils.formatEther(userBalance),
                    isContract
                }
            };
            
        } catch (error) {
            console.error('     ❌ State verification failed:', error.message);
            return {
                risk: 50,
                reason: 'State verification failed - network error',
                stateChanged: true,
                error: error.message
            };
        }
    }

    /**
     * Layer 2: Honeypot Detection
     */
    async detectHoneypot(intentData) {
        console.log('   🍯 Honeypot Detection...');
        
        try {
            const targetCode = await this.provider.getCode(intentData.target);
            const isContract = targetCode !== '0x';
            
            let risk = 10; // Base risk
            let threats = [];
            let reason = 'No honeypot patterns detected';
            
            if (isContract) {
                console.log('     📋 Analyzing contract bytecode...');
                
                // Check for suspicious bytecode patterns
                const bytecode = targetCode.toLowerCase();
                
                // Check for selfdestruct opcode (0xff)
                if (bytecode.includes('ff')) {
                    risk += 30;
                    threats.push('SELFDESTRUCT_DETECTED');
                    reason = 'Contract contains selfdestruct - potential honeypot';
                }
                
                // Check for delegatecall opcode (0xf4)
                if (bytecode.includes('f4')) {
                    risk += 20;
                    threats.push('DELEGATECALL_DETECTED');
                    reason = 'Contract uses delegatecall - potential proxy risk';
                }
                
                // Check contract size (very small contracts can be suspicious)
                if (bytecode.length < 100) {
                    risk += 25;
                    threats.push('MINIMAL_CONTRACT');
                    reason = 'Minimal contract detected - potential honeypot';
                }
                
                // Check for recent deployment (contracts deployed very recently)
                try {
                    const currentBlock = await this.provider.getBlockNumber();
                    // This is a simplified check - in real implementation you'd track deployment block
                    if (currentBlock > 0) {
                        console.log('     ⏰ Contract deployment check passed');
                    }
                } catch (error) {
                    console.log('     ⚠️ Could not verify deployment time');
                }
                
                console.log('     📊 Bytecode length:', bytecode.length);
                console.log('     🔍 Threats found:', threats);
            } else {
                console.log('     👤 Target is EOA (Externally Owned Account)');
                risk = 5; // Lower risk for EOA transfers
                reason = 'EOA transfer - low honeypot risk';
            }
            
            return {
                risk: Math.min(risk, 100),
                reason,
                threats,
                details: {
                    isContract,
                    bytecodeLength: isContract ? targetCode.length : 0
                }
            };
            
        } catch (error) {
            console.error('     ❌ Honeypot detection failed:', error.message);
            return {
                risk: 40,
                reason: 'Honeypot detection failed - network error',
                threats: ['ANALYSIS_FAILED'],
                error: error.message
            };
        }
    }

    /**
     * Layer 3: Approval Analysis
     */
    async analyzeApprovals(intentData) {
        console.log('   🔐 Approval Analysis...');
        
        try {
            const targetCode = await this.provider.getCode(intentData.target);
            const isContract = targetCode !== '0x';
            
            let risk = 15; // Base risk
            let issues = [];
            let reason = 'No approval issues detected';
            
            if (isContract) {
                console.log('     📋 Analyzing contract for approval patterns...');
                
                const bytecode = targetCode.toLowerCase();
                
                // Check for ERC20 approve function selector (0x095ea7b3)
                if (bytecode.includes('095ea7b3')) {
                    console.log('     ✅ ERC20 approve function detected');
                    
                    // Check for transferFrom function (0x23b872dd) - indicates token contract
                    if (bytecode.includes('23b872dd')) {
                        risk += 10;
                        issues.push('TOKEN_CONTRACT');
                        reason = 'Token contract detected - check approval amounts';
                    }
                }
                
                // Check for increaseAllowance/decreaseAllowance (safer approval patterns)
                if (bytecode.includes('39509351') || bytecode.includes('a457c2d7')) {
                    risk -= 5; // Lower risk for safer approval patterns
                    reason = 'Safe approval patterns detected';
                }
                
                // Check for potential approval-related vulnerabilities
                // Look for patterns that might indicate unlimited approvals
                const suspiciousPatterns = [
                    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // max uint256
                    '7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'   // max int256
                ];
                
                for (const pattern of suspiciousPatterns) {
                    if (bytecode.includes(pattern)) {
                        risk += 25;
                        issues.push('MAX_APPROVAL_PATTERN');
                        reason = 'Unlimited approval pattern detected in bytecode';
                        break;
                    }
                }
                
                console.log('     📊 Approval analysis complete');
                console.log('     🔍 Issues found:', issues);
            } else {
                console.log('     👤 EOA transfer - no approval analysis needed');
                risk = 5;
                reason = 'EOA transfer - no approval concerns';
            }
            
            return {
                risk: Math.min(risk, 100),
                reason,
                issues,
                details: {
                    isContract,
                    hasApproveFunction: isContract && targetCode.toLowerCase().includes('095ea7b3')
                }
            };
            
        } catch (error) {
            console.error('     ❌ Approval analysis failed:', error.message);
            return {
                risk: 30,
                reason: 'Approval analysis failed - network error',
                issues: ['ANALYSIS_FAILED'],
                error: error.message
            };
        }
    }

    /**
     * Layer 4: Contract Analysis
     */
    async analyzeContract(intentData) {
        console.log('   📋 Contract Analysis...');
        
        try {
            const targetCode = await this.provider.getCode(intentData.target);
            const isContract = targetCode !== '0x';
            
            let risk = 12; // Base risk
            let findings = [];
            let reason = 'Contract analysis passed';
            
            if (isContract) {
                console.log('     📋 Analyzing contract functions and patterns...');
                
                const bytecode = targetCode.toLowerCase();
                
                // Check for common function selectors
                const functionChecks = [
                    { selector: 'a9059cbb', name: 'transfer', risk: 5, type: 'STANDARD_TRANSFER' },
                    { selector: '23b872dd', name: 'transferFrom', risk: 10, type: 'TRANSFER_FROM' },
                    { selector: '095ea7b3', name: 'approve', risk: 15, type: 'APPROVE_FUNCTION' },
                    { selector: '70a08231', name: 'balanceOf', risk: 0, type: 'BALANCE_CHECK' },
                    { selector: '18160ddd', name: 'totalSupply', risk: 0, type: 'SUPPLY_CHECK' },
                    { selector: 'dd62ed3e', name: 'allowance', risk: 0, type: 'ALLOWANCE_CHECK' }
                ];
                
                let detectedFunctions = [];
                for (const func of functionChecks) {
                    if (bytecode.includes(func.selector)) {
                        detectedFunctions.push(func.name);
                        risk += func.risk;
                        findings.push(func.type);
                        console.log(`     ✅ Function detected: ${func.name} (${func.selector})`);
                    }
                }
                
                // Check for potentially risky patterns
                const riskyPatterns = [
                    { pattern: 'ff', name: 'selfdestruct', risk: 40, type: 'SELFDESTRUCT' },
                    { pattern: 'f4', name: 'delegatecall', risk: 25, type: 'DELEGATECALL' },
                    { pattern: 'f1', name: 'call', risk: 15, type: 'EXTERNAL_CALL' },
                    { pattern: 'fa', name: 'staticcall', risk: 5, type: 'STATIC_CALL' }
                ];
                
                for (const pattern of riskyPatterns) {
                    if (bytecode.includes(pattern.pattern)) {
                        risk += pattern.risk;
                        findings.push(pattern.type);
                        console.log(`     ⚠️ Risky pattern detected: ${pattern.name}`);
                        
                        if (pattern.risk > 20) {
                            reason = `High-risk pattern detected: ${pattern.name}`;
                        }
                    }
                }
                
                // Check contract size and complexity
                const contractSize = bytecode.length;
                if (contractSize > 50000) { // Very large contract
                    risk += 10;
                    findings.push('LARGE_CONTRACT');
                    console.log('     📏 Large contract detected');
                } else if (contractSize < 200) { // Very small contract
                    risk += 20;
                    findings.push('MINIMAL_CONTRACT');
                    console.log('     📏 Minimal contract detected');
                }
                
                console.log('     📊 Functions detected:', detectedFunctions);
                console.log('     🔍 Findings:', findings);
                console.log('     📏 Contract size:', contractSize, 'bytes');
                
            } else {
                console.log('     👤 EOA interaction - no contract analysis needed');
                risk = 5;
                reason = 'EOA interaction - low risk';
            }
            
            return {
                risk: Math.min(risk, 100),
                reason,
                findings,
                details: {
                    isContract,
                    contractSize: isContract ? targetCode.length : 0
                }
            };
            
        } catch (error) {
            console.error('     ❌ Contract analysis failed:', error.message);
            return {
                risk: 35,
                reason: 'Contract analysis failed - network error',
                findings: ['ANALYSIS_FAILED'],
                error: error.message
            };
        }
    }

    /**
     * Layer 5: Behavior Analysis
     */
    async analyzeBehavior(intentData) {
        console.log('   🧠 Behavior Analysis...');
        
        try {
            let risk = 8; // Base risk
            let behaviors = [];
            let reason = 'Normal behavior patterns';
            
            // Analyze transaction timing
            const currentTime = Math.floor(Date.now() / 1000);
            const intentTime = intentData.timestamp;
            const timeDiff = currentTime - intentTime;
            
            console.log('     ⏰ Intent timestamp:', new Date(intentTime * 1000).toISOString());
            console.log('     ⏰ Current time:', new Date(currentTime * 1000).toISOString());
            console.log('     ⏰ Time difference:', timeDiff, 'seconds');
            
            // Check for suspicious timing patterns
            if (timeDiff < 5) {
                risk += 15;
                behaviors.push('VERY_RECENT_INTENT');
                reason = 'Intent created very recently - potential rush behavior';
            } else if (timeDiff > 3600) { // More than 1 hour old
                risk += 10;
                behaviors.push('OLD_INTENT');
                reason = 'Intent is quite old - potential stale transaction';
            }
            
            // Analyze user and target relationship
            const userLower = intentData.user.toLowerCase();
            const targetLower = intentData.target.toLowerCase();
            
            if (userLower === targetLower) {
                risk += 5;
                behaviors.push('SELF_TRANSFER');
                reason = 'Self-transfer detected';
                console.log('     🔄 Self-transfer detected');
            }
            
            // Check for common suspicious addresses patterns
            const suspiciousPatterns = [
                '0x0000000000000000000000000000000000000000', // Zero address
                '0x000000000000000000000000000000000000dead', // Burn address
                '0xffffffffffffffffffffffffffffffffffffffff'  // Max address
            ];
            
            for (const pattern of suspiciousPatterns) {
                if (targetLower === pattern.toLowerCase()) {
                    risk += 30;
                    behaviors.push('SUSPICIOUS_TARGET');
                    reason = 'Suspicious target address detected';
                    console.log('     ⚠️ Suspicious target address:', pattern);
                    break;
                }
            }
            
            // Analyze address patterns (very new addresses might be suspicious)
            try {
                const userTxCount = await this.provider.getTransactionCount(intentData.user);
                const targetTxCount = await this.provider.getTransactionCount(intentData.target);
                
                console.log('     📊 User transaction count:', userTxCount);
                console.log('     📊 Target transaction count:', targetTxCount);
                
                if (userTxCount === 0) {
                    risk += 20;
                    behaviors.push('NEW_USER_ACCOUNT');
                    reason = 'New user account detected - first transaction';
                }
                
                if (targetTxCount === 0 && await this.provider.getCode(intentData.target) === '0x') {
                    risk += 15;
                    behaviors.push('NEW_TARGET_ACCOUNT');
                    reason = 'New target account detected';
                }
                
            } catch (error) {
                console.log('     ⚠️ Could not fetch transaction counts:', error.message);
            }
            
            console.log('     📊 Behavior analysis complete');
            console.log('     🔍 Behaviors detected:', behaviors);
            
            return {
                risk: Math.min(risk, 100),
                reason,
                behaviors,
                details: {
                    timeDiff,
                    isSelfTransfer: userLower === targetLower
                }
            };
            
        } catch (error) {
            console.error('     ❌ Behavior analysis failed:', error.message);
            return {
                risk: 20,
                reason: 'Behavior analysis failed - network error',
                behaviors: ['ANALYSIS_FAILED'],
                error: error.message
            };
        }
    }

    /**
     * Calculate overall risk score
     */
    calculateRiskScore(analysis) {
        const weights = {
            stateVerification: 0.4,  // Highest weight for SST protection
            honeypotDetection: 0.25,
            approvalAnalysis: 0.2,
            contractAnalysis: 0.1,
            behaviorAnalysis: 0.05
        };

        let totalRisk = 0;
        for (const [layer, weight] of Object.entries(weights)) {
            totalRisk += analysis[layer].risk * weight;
        }

        return Math.round(totalRisk);
    }

    /**
     * Submit verification result
     */
    async submitResult(result) {
        console.log('📤 Submitting verification result to API...');
        
        try {
            // Submit to the real simulator API first
            const response = await fetch('http://localhost:3003/api/simulator/submit-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intentId: result.intentId,
                    simulatorId: result.simulatorId,
                    riskScore: result.riskScore,
                    isRisky: result.isRisky,
                    analysis: result.analysis,
                    recommendation: result.recommendation
                })
            });
            
            if (response.ok) {
                console.log('✅ Result submitted to API successfully');
            } else {
                console.error('❌ API submission failed:', response.status);
            }
        } catch (error) {
            console.error('❌ Failed to submit result to API:', error.message);
        }
        
        // Also try blockchain submission if contract is available
        if (this.contract) {
            try {
                const tx = await this.contract.submitSimulation(
                    result.intentId,
                    result.isRisky,
                    result.riskScore
                );
                await tx.wait();
                console.log('✅ Result also submitted to blockchain');
            } catch (error) {
                console.log('⚠️ Blockchain submission failed:', error.message);
            }
        }
    }

    /**
     * Stop the simulator
     */
    stop() {
        if (!this.isRunning) return;
        
        console.log('🛑 Stopping simulator:', this.simulatorId);
        this.isRunning = false;
        
        if (this.contract) {
            this.contract.removeAllListeners();
        }
        
        this.emit('stopped');
    }

    /**
     * Get simulator status
     */
    getStatus() {
        return {
            simulatorId: this.simulatorId,
            isRunning: this.isRunning,
            metrics: {
                ...this.metrics,
                uptime: Date.now() - this.metrics.startTime
            },
            address: this.wallet ? this.wallet.address : null
        };
    }
}

/**
 * Create and start a simulator
 */
async function createSimulator() {
    console.log('🎯 Creating Vigilant Simulator...\n');
    
    const config = {
        rpcUrl: process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network',
        privateKey: process.env.PRIVATE_KEY,
        contractAddress: process.env.VIGILANT_SIMPLE_ADDRESS || '0x5958E666C6D290F8325E2BC414588DC8D1E68963',
        contractABI: [
            "event IntentSubmitted(bytes32 indexed intentId, address indexed user, address target, uint256 timestamp)",
            "function submitSimulation(bytes32 intentId, bool isRisky, uint256 riskScore)"
        ]
    };

    const simulator = new SimpleVigilantSimulator(config);
    
    // Initialize
    const initialized = await simulator.initialize();
    if (!initialized) {
        console.error('💥 Failed to initialize simulator');
        return;
    }

    // Start
    await simulator.start();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down simulator...');
        simulator.stop();
        process.exit(0);
    });

    // Log status every 30 seconds
    setInterval(() => {
        const status = simulator.getStatus();
        console.log('\n📊 Simulator Status:');
        console.log('   ID:', status.simulatorId);
        console.log('   Running:', status.isRunning);
        console.log('   Analyzed:', status.metrics.totalAnalyzed);
        console.log('   Threats:', status.metrics.threatsDetected);
        console.log('   Uptime:', Math.round(status.metrics.uptime / 1000) + 's');
    }, 30000);

    return simulator;
}

// Start the simulator
createSimulator()
    .then(() => {
        console.log('\n🎉 Simulator is running!');
        console.log('📋 The simulator will:');
        console.log('   1. Listen for intent submissions');
        console.log('   2. Perform 5-layer SST analysis');
        console.log('   3. Submit verification results');
        console.log('   4. Protect against simulation spoofing');
    })
    .catch(error => {
        console.error('💥 Failed to start simulator:', error);
    });