// backend/SimulatorNode.js
import { ethers } from 'ethers';
import WebSocket from 'ws';

class SimulatorNode {
  constructor(privateKey, vigilantAddress, threatDbAddress, somniaRPC) {
    this.provider = new ethers.providers.JsonRpcProvider(somniaRPC);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Contract ABIs (simplified for demo)
    this.VIGILANT_ABI = [
      "function registerSimulator() external payable",
      "function submitSimulation(bytes32 intentId, bytes32 resultHash, bool isRisky, uint256 riskScore) external",
      "function getIntent(bytes32 intentId) external view returns (tuple(address user, address target, bytes callData, uint256 value, uint256 timestamp, uint256 deadline, bool verified, bool executed, bytes32 stateSnapshot))",
      "function simulatorStakes(address) external view returns (uint256)",
      "event IntentSubmitted(bytes32 indexed intentId, address indexed user, address target, uint256 timestamp)"
    ];
    
    this.THREAT_DB_ABI = [
      "function getThreatScore(address contract_) external view returns (uint256)",
      "function isBlacklisted(address contract_) external view returns (bool)"
    ];
    
    this.vigilantContract = new ethers.Contract(
      vigilantAddress,
      this.VIGILANT_ABI,
      this.wallet
    );
    
    this.threatDb = new ethers.Contract(
      threatDbAddress,
      this.THREAT_DB_ABI,
      this.provider
    );
    
    this.nodeId = this.wallet.address.slice(0, 10);
  }
  
  async start() {
    console.log(`🔍 Simulator Node ${this.nodeId} starting...`);
    
    // Register as simulator (stake 10 ETH)
    await this.registerSimulator();
    
    // Listen for new intents
    this.vigilantContract.on("IntentSubmitted", async (intentId, user, target, timestamp, event) => {
      console.log(`\n📥 New intent received: ${intentId.slice(0, 10)}...`);
      await this.analyzeIntent(intentId, user, target);
    });
    
    console.log(`✅ Simulator Node ${this.nodeId} running`);
  }
  
  async registerSimulator() {
    try {
      const isRegistered = await this.vigilantContract.simulatorStakes(this.wallet.address);
      
      if (isRegistered.eq(0)) {
        console.log(`📝 Registering simulator ${this.nodeId}...`);
        const tx = await this.vigilantContract.registerSimulator({
          value: ethers.utils.parseEther("10"),
          gasLimit: 500000
        });
        await tx.wait();
        console.log(`✅ Registered with 10 ETH stake`);
      } else {
        console.log(`✅ Already registered (${ethers.utils.formatEther(isRegistered)} ETH staked)`);
      }
    } catch (error) {
      console.error(`❌ Registration failed:`, error.message);
    }
  }
  
  async analyzeIntent(intentId, user, target) {
    console.log(`\n🔍 [${this.nodeId}] Analyzing intent ${intentId.slice(0, 10)}...`);
    
    try {
      // Get full intent details
      const intentData = await this.vigilantContract.getIntent(intentId);
      
      // Run all analysis layers in parallel
      const [
        simulationResult,
        gasResult,
        opcodeResult,
        approvalResult,
        threatResult,
        mempoolResult
      ] = await Promise.all([
        this.simulateTransaction(intentData),
        this.analyzeGasUsage(intentData),
        this.checkDangerousOpcodes(intentData),
        this.analyzeTokenApprovals(intentData),
        this.checkThreatDatabase(target),
        this.analyzeMempoolThreats(intentData)
      ]);
      
      const results = [simulationResult, gasResult, opcodeResult, approvalResult, threatResult, mempoolResult];
      
      // Calculate total risk score
      const riskScore = this.calculateRiskScore(results);
      const isRisky = riskScore >= 50;
      
      // Generate result hash
      const resultHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'uint256', 'bool', 'uint256'],
          [target, riskScore, isRisky, Date.now()]
        )
      );
      
      // Submit to contract
      console.log(`📊 [${this.nodeId}] Risk Score: ${riskScore}/100 ${isRisky ? '⚠️ RISKY' : '✅ SAFE'}`);
      this.logAnalysisDetails(results);
      
      const tx = await this.vigilantContract.submitSimulation(
        intentId,
        resultHash,
        isRisky,
        riskScore,
        { gasLimit: 300000 }
      );
      
      await tx.wait();
      console.log(`✅ [${this.nodeId}] Simulation submitted`);
      
    } catch (error) {
      console.error(`❌ [${this.nodeId}] Analysis failed:`, error.message);
      
      try {
        // Submit failure as maximum risk
        const tx = await this.vigilantContract.submitSimulation(
          intentId,
          ethers.constants.HashZero,
          true,
          100,
          { gasLimit: 300000 }
        );
        await tx.wait();
        console.log(`⚠️ [${this.nodeId}] Submitted failure result`);
      } catch (submitError) {
        console.error(`❌ [${this.nodeId}] Failed to submit error result:`, submitError.message);
      }
    }
  }
  
  async simulateTransaction(intent) {
    try {
      const result = await this.provider.call({
        from: intent.user,
        to: intent.target,
        data: intent.callData,
        value: intent.value
      });
      
      return { type: 'simulation', risk: 0, success: true, details: 'Transaction simulation successful' };
    } catch (error) {
      return { type: 'simulation', risk: 50, success: false, details: `Simulation failed: ${error.message}` };
    }
  }
  
  async analyzeGasUsage(intent) {
    try {
      const gasEstimate = await this.provider.estimateGas({
        from: intent.user,
        to: intent.target,
        data: intent.callData,
        value: intent.value
      });
      
      let risk = 0;
      let details = `Gas estimate: ${gasEstimate.toString()}`;
      
      if (gasEstimate.gt(500000)) {
        risk = 20;
        details += ' (High gas usage)';
      }
      if (gasEstimate.gt(1000000)) {
        risk = 40;
        details += ' (Very high gas usage)';
      }
      
      return { type: 'gas', risk, details };
    } catch (error) {
      return { type: 'gas', risk: 30, details: `Gas estimation failed: ${error.message}` };
    }
  }
  
  async checkDangerousOpcodes(intent) {
    try {
      // For demo purposes, we'll simulate opcode analysis
      // In a real implementation, you'd use debug_traceCall
      
      let risk = 0;
      let details = 'Opcode analysis completed';
      
      // Check if calldata contains potentially dangerous function selectors
      const callData = intent.callData.toLowerCase();
      
      // Check for delegatecall patterns (simplified)
      if (callData.includes('f4')) { // DELEGATECALL opcode
        risk += 30;
        details += ' (DELEGATECALL detected)';
      }
      
      // Check for selfdestruct patterns
      if (callData.includes('ff')) { // SELFDESTRUCT opcode
        risk += 70;
        details += ' (SELFDESTRUCT detected)';
      }
      
      return { type: 'opcodes', risk: Math.min(risk, 100), details };
    } catch (error) {
      return { type: 'opcodes', risk: 0, details: `Opcode analysis failed: ${error.message}` };
    }
  }
  
  async analyzeTokenApprovals(intent) {
    const approveSelector = '0x095ea7b3'; // approve(address,uint256)
    const approveAllSelector = '0xa22cb465'; // setApprovalForAll(address,bool)
    
    try {
      const callData = intent.callData.toLowerCase();
      
      if (callData.startsWith(approveSelector)) {
        // Extract amount from calldata (simplified)
        const amount = callData.slice(74, 138); // Extract amount part
        
        if (amount === 'f'.repeat(64)) { // Max uint256
          return { type: 'approval', risk: 80, details: 'Unlimited token approval detected' };
        }
        return { type: 'approval', risk: 20, details: 'Token approval detected' };
      }
      
      if (callData.startsWith(approveAllSelector)) {
        return { type: 'approval', risk: 40, details: 'SetApprovalForAll detected' };
      }
      
      return { type: 'approval', risk: 0, details: 'No suspicious approvals' };
    } catch (error) {
      return { type: 'approval', risk: 0, details: `Approval analysis failed: ${error.message}` };
    }
  }
  
  async checkThreatDatabase(target) {
    try {
      const [threatScore, isBlacklisted] = await Promise.all([
        this.threatDb.getThreatScore(target),
        this.threatDb.isBlacklisted(target)
      ]);
      
      if (isBlacklisted) {
        return { type: 'blacklist', risk: 100, details: 'Contract is blacklisted' };
      }
      
      const score = threatScore.toNumber();
      return { 
        type: 'blacklist', 
        risk: score, 
        details: `Threat score: ${score}/100` 
      };
    } catch (error) {
      return { type: 'blacklist', risk: 0, details: `Threat DB check failed: ${error.message}` };
    }
  }
  
  async analyzeMempoolThreats(intent) {
    try {
      // Simulate mempool analysis
      // In a real implementation, you'd check the actual mempool
      
      let risk = 0;
      let details = 'Mempool analysis completed';
      
      // Simulate finding competing transactions
      const randomCompetitors = Math.floor(Math.random() * 3);
      
      if (randomCompetitors > 0) {
        risk = randomCompetitors * 15;
        details = `${randomCompetitors} competing transactions found`;
      }
      
      return { type: 'mempool', risk: Math.min(risk, 100), details };
    } catch (error) {
      return { type: 'mempool', risk: 0, details: `Mempool analysis failed: ${error.message}` };
    }
  }
  
  calculateRiskScore(results) {
    const weights = {
      simulation: 0.15,
      gas: 0.10,
      opcodes: 0.25,
      approval: 0.15,
      blacklist: 0.25,
      mempool: 0.10
    };
    
    let totalRisk = 0;
    
    for (const result of results) {
      const weight = weights[result.type] || 0;
      totalRisk += result.risk * weight;
    }
    
    return Math.min(Math.round(totalRisk), 100);
  }
  
  logAnalysisDetails(results) {
    console.log(`    📋 Analysis Details:`);
    for (const result of results) {
      const icon = result.risk >= 50 ? '🔴' : result.risk >= 20 ? '🟡' : '🟢';
      console.log(`      ${icon} ${result.type}: ${result.risk}/100 - ${result.details}`);
    }
  }
}

// Export for use in other modules
export default SimulatorNode;

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const SIMULATOR_KEYS = [
    process.env.SIMULATOR_1_KEY,
    process.env.SIMULATOR_2_KEY,
    process.env.SIMULATOR_3_KEY
  ].filter(Boolean);

  if (SIMULATOR_KEYS.length === 0) {
    console.error('❌ No simulator keys found in environment variables');
    process.exit(1);
  }

  async function main() {
    const simulators = SIMULATOR_KEYS.map((key, i) => {
      const node = new SimulatorNode(
        key,
        process.env.VIGILANT_ADDRESS,
        process.env.THREAT_DB_ADDRESS,
        process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network'
      );
      console.log(`Starting Simulator ${i + 1}...`);
      return node.start();
    });
    
    await Promise.all(simulators);
    console.log(`\n🚀 All ${SIMULATOR_KEYS.length} simulators running!`);
  }

  main().catch(console.error);
}