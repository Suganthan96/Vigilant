// backend/MempoolWatcher.js
import { ethers } from 'ethers';
import WebSocket from 'ws';

class MempoolWatcher {
  constructor(somniaRPC) {
    this.provider = new ethers.providers.JsonRpcProvider(somniaRPC);
    this.mempoolData = new Map(); // Store recent transactions
    this.threatPatterns = new Set();
    this.isRunning = false;
    
    // Initialize threat patterns
    this.initializeThreatPatterns();
  }
  
  initializeThreatPatterns() {
    // Known malicious function selectors
    this.threatPatterns.add('0x40c10f19'); // mint - often abused
    this.threatPatterns.add('0xa9059cbb'); // transfer - check for unusual amounts
    this.threatPatterns.add('0x095ea7b3'); // approve - unlimited approvals
    this.threatPatterns.add('0x23b872dd'); // transferFrom - potential drain
    
    console.log('🔍 Initialized threat pattern detection');
  }
  
  async start() {
    console.log('👀 Mempool Watcher starting...');
    
    this.isRunning = true;
    
    // Start mempool monitoring
    this.monitorMempool();
    
    // Set up WebSocket server for real-time alerts
    this.setupWebSocketServer();
    
    // Clean up old data every minute
    setInterval(() => this.cleanupOldData(), 60000);
    
    console.log('✅ Mempool Watcher running');
  }
  
  async monitorMempool() {
    try {
      // Monitor pending transactions
      this.provider.on('pending', async (txHash) => {
        if (!this.isRunning) return;
        
        try {
          const tx = await this.provider.getTransaction(txHash);
          if (tx) {
            await this.analyzePendingTransaction(tx);
          }
        } catch (error) {
          // Ignore errors for individual transactions
        }
      });
      
      // Also periodically fetch mempool content if available
      this.fetchMempoolContent();
      
    } catch (error) {
      console.error('❌ Failed to start mempool monitoring:', error.message);
    }
  }
  
  async fetchMempoolContent() {
    try {
      // Try to get mempool content (not all providers support this)
      const pendingBlock = await this.provider.send('eth_getBlockByNumber', ['pending', false]);
      
      if (pendingBlock && pendingBlock.transactions) {
        console.log(`📊 Mempool size: ${pendingBlock.transactions.length} transactions`);
        
        // Analyze transaction patterns
        await this.analyzeTransactionPatterns(pendingBlock.transactions);
      }
    } catch (error) {
      // This is expected for providers that don't support mempool queries
      console.log('ℹ️  Mempool content not available from this provider');
    }
    
    // Check again in 10 seconds
    setTimeout(() => this.fetchMempoolContent(), 10000);
  }
  
  async analyzePendingTransaction(tx) {
    const analysis = {
      hash: tx.hash,
      timestamp: Date.now(),
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasPrice: tx.gasPrice,
      gasLimit: tx.gasLimit,
      data: tx.data,
      threatLevel: 0,
      flags: []
    };
    
    // Analyze transaction for threats
    this.analyzeGasPrice(tx, analysis);
    this.analyzeFunctionCall(tx, analysis);
    this.analyzeValue(tx, analysis);
    this.analyzeContractInteraction(tx, analysis);
    
    // Store in mempool data
    this.mempoolData.set(tx.hash, analysis);
    
    // Alert if high threat level
    if (analysis.threatLevel >= 50) {
      this.emitThreatAlert(analysis);
    }
    
    // Log interesting transactions
    if (analysis.flags.length > 0) {
      console.log(`🔍 Flagged transaction: ${tx.hash.slice(0, 10)}... (${analysis.flags.join(', ')})`);
    }
  }
  
  analyzeGasPrice(tx, analysis) {
    try {
      const gasPrice = tx.gasPrice;
      
      // Check for unusually high gas prices (potential front-running)
      if (gasPrice && gasPrice.gt(ethers.utils.parseUnits('100', 'gwei'))) {
        analysis.threatLevel += 20;
        analysis.flags.push('high_gas_price');
      }
      
      // Check for zero gas price
      if (gasPrice && gasPrice.eq(0)) {
        analysis.threatLevel += 10;
        analysis.flags.push('zero_gas_price');
      }
    } catch (error) {
      // Ignore gas price analysis errors
    }
  }
  
  analyzeFunctionCall(tx, analysis) {
    if (!tx.data || tx.data === '0x') return;
    
    try {
      const selector = tx.data.slice(0, 10);
      
      // Check against known threat patterns
      if (this.threatPatterns.has(selector)) {
        analysis.threatLevel += 30;
        analysis.flags.push(`suspicious_function_${selector}`);
      }
      
      // Check for unlimited approvals
      if (selector === '0x095ea7b3') { // approve
        const amount = tx.data.slice(74, 138);
        if (amount === 'f'.repeat(64)) {
          analysis.threatLevel += 40;
          analysis.flags.push('unlimited_approval');
        }
      }
      
      // Check for large data payloads (potential exploit)
      if (tx.data.length > 10000) {
        analysis.threatLevel += 15;
        analysis.flags.push('large_payload');
      }
      
    } catch (error) {
      // Ignore function call analysis errors
    }
  }
  
  analyzeValue(tx, analysis) {
    try {
      const value = tx.value;
      
      // Check for high-value transactions
      if (value && value.gt(ethers.utils.parseEther('10'))) {
        analysis.threatLevel += 15;
        analysis.flags.push('high_value');
      }
      
      // Check for dust transactions
      if (value && value.gt(0) && value.lt(ethers.utils.parseEther('0.001'))) {
        analysis.threatLevel += 5;
        analysis.flags.push('dust_transaction');
      }
    } catch (error) {
      // Ignore value analysis errors
    }
  }
  
  analyzeContractInteraction(tx, analysis) {
    // Check if interacting with a contract
    if (tx.to && tx.data && tx.data !== '0x') {
      analysis.flags.push('contract_interaction');
      
      // Check for multiple transactions to same contract
      const sameContractTxs = Array.from(this.mempoolData.values())
        .filter(t => t.to === tx.to && t.timestamp > Date.now() - 60000);
      
      if (sameContractTxs.length > 3) {
        analysis.threatLevel += 25;
        analysis.flags.push('multiple_interactions');
      }
    }
  }
  
  async analyzeTransactionPatterns(txHashes) {
    const patterns = {
      sandwichAttacks: 0,
      frontRunning: 0,
      mevActivity: 0,
      unusualVolume: 0
    };
    
    // Analyze for sandwich attacks and MEV activity
    const recentTxs = Array.from(this.mempoolData.values())
      .filter(tx => tx.timestamp > Date.now() - 30000)
      .sort((a, b) => b.gasPrice - a.gasPrice);
    
    // Check for sandwich attack patterns
    for (let i = 0; i < recentTxs.length - 2; i++) {
      const tx1 = recentTxs[i];
      const tx2 = recentTxs[i + 1];
      const tx3 = recentTxs[i + 2];
      
      if (tx1.from === tx3.from && tx1.to === tx3.to && tx2.from !== tx1.from) {
        patterns.sandwichAttacks++;
      }
    }
    
    // Log patterns if significant
    if (patterns.sandwichAttacks > 0) {
      console.log(`🥪 Potential sandwich attacks detected: ${patterns.sandwichAttacks}`);
      this.emitMevAlert('sandwich_attack', patterns.sandwichAttacks);
    }
  }
  
  emitThreatAlert(analysis) {
    const alert = {
      type: 'threat_detected',
      timestamp: new Date().toISOString(),
      transaction: {
        hash: analysis.hash.slice(0, 10),
        from: analysis.from?.slice(0, 10),
        to: analysis.to?.slice(0, 10),
        threatLevel: analysis.threatLevel,
        flags: analysis.flags
      },
      severity: analysis.threatLevel >= 75 ? 'CRITICAL' : 'HIGH'
    };
    
    console.log(`🚨 THREAT ALERT: ${JSON.stringify(alert, null, 2)}`);
    
    // Broadcast to WebSocket clients
    this.broadcastAlert(alert);
  }
  
  emitMevAlert(type, count) {
    const alert = {
      type: 'mev_activity',
      timestamp: new Date().toISOString(),
      activity: {
        type,
        count,
        timeWindow: '30s'
      },
      severity: 'MEDIUM'
    };
    
    console.log(`⚡ MEV ALERT: ${JSON.stringify(alert, null, 2)}`);
    
    // Broadcast to WebSocket clients
    this.broadcastAlert(alert);
  }
  
  setupWebSocketServer() {
    const wss = new WebSocket.Server({ port: process.env.MEMPOOL_WS_PORT || 3004 });
    this.wsClients = new Set();
    
    wss.on('connection', (ws) => {
      console.log('📡 Frontend connected to mempool watcher');
      this.wsClients.add(ws);
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('📥 Received from frontend:', data);
        } catch (error) {
          console.error('❌ Invalid WebSocket message:', error.message);
        }
      });
      
      ws.on('close', () => {
        console.log('📡 Frontend disconnected from mempool watcher');
        this.wsClients.delete(ws);
      });
      
      // Send initial status
      ws.send(JSON.stringify({
        type: 'status',
        mempoolSize: this.mempoolData.size,
        monitoringActive: this.isRunning
      }));
    });
    
    console.log(`📡 Mempool WebSocket server running on port ${process.env.MEMPOOL_WS_PORT || 3004}`);
  }
  
  broadcastAlert(alert) {
    const message = JSON.stringify(alert);
    
    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  
  cleanupOldData() {
    const cutoff = Date.now() - 300000; // 5 minutes
    let cleaned = 0;
    
    for (const [hash, data] of this.mempoolData) {
      if (data.timestamp < cutoff) {
        this.mempoolData.delete(hash);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old mempool entries`);
    }
  }
  
  // Method to get current status
  getStatus() {
    const recentTxs = Array.from(this.mempoolData.values())
      .filter(tx => tx.timestamp > Date.now() - 60000);
    
    const threatCounts = recentTxs.reduce((acc, tx) => {
      if (tx.threatLevel >= 75) acc.critical++;
      else if (tx.threatLevel >= 50) acc.high++;
      else if (tx.threatLevel >= 25) acc.medium++;
      else acc.low++;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });
    
    return {
      totalTransactions: this.mempoolData.size,
      recentTransactions: recentTxs.length,
      threatDistribution: threatCounts,
      isMonitoring: this.isRunning
    };
  }
  
  stop() {
    this.isRunning = false;
    console.log('⏹️  Mempool Watcher stopped');
  }
}

// Export for use in other modules
export default MempoolWatcher;

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const watcher = new MempoolWatcher(
      process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network'
    );
    
    await watcher.start();
    
    // Log status every 60 seconds
    setInterval(() => {
      const status = watcher.getStatus();
      console.log(`\n📊 Mempool Status: ${status.recentTransactions} recent txs, Threats: ${status.threatDistribution.critical}🔴 ${status.threatDistribution.high}🟡 ${status.threatDistribution.medium}🟠`);
    }, 60000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down mempool watcher...');
      watcher.stop();
      process.exit(0);
    });
  }

  main().catch(console.error);
}