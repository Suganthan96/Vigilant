// backend/StateMonitor.js
import { ethers } from 'ethers';
import WebSocket from 'ws';

class StateMonitor {
  constructor(vigilantAddress, somniaRPC, monitorKey) {
    this.provider = new ethers.providers.JsonRpcProvider(somniaRPC);
    this.wallet = new ethers.Wallet(monitorKey, this.provider);
    
    this.VIGILANT_ABI = [
      "function flagStateChange(bytes32 intentId, address target) external",
      "function getIntent(bytes32 intentId) external view returns (tuple(address user, address target, bytes callData, uint256 value, uint256 timestamp, uint256 deadline, bool verified, bool executed, bytes32 stateSnapshot))",
      "event IntentSubmitted(bytes32 indexed intentId, address indexed user, address target, uint256 timestamp)",
      "event StateChangeDetected(bytes32 indexed intentId, address target, uint256 timestamp)"
    ];
    
    this.vigilantContract = new ethers.Contract(
      vigilantAddress,
      this.VIGILANT_ABI,
      this.wallet
    );
    
    this.activeIntents = new Map();
    this.monitoredContracts = new Set();
  }
  
  async start() {
    console.log('👁️  State Monitor starting...');
    
    // Listen for new intents to monitor
    this.vigilantContract.on("IntentSubmitted", async (intentId, user, target, timestamp, event) => {
      console.log(`\n👁️  New intent to monitor: ${intentId.slice(0, 10)}... targeting ${target.slice(0, 10)}...`);
      await this.monitorIntent(intentId, user, target);
    });
    
    // Set up WebSocket for real-time monitoring
    this.setupWebSocketMonitoring();
    
    console.log('✅ State Monitor running');
  }
  
  async monitorIntent(intentId, user, target) {
    const monitorData = {
      target,
      user,
      startTime: Date.now(),
      eventCount: 0
    };
    
    this.activeIntents.set(intentId, monitorData);
    this.monitoredContracts.add(target);
    
    console.log(`👁️  Monitoring contract ${target.slice(0, 10)}... for intent ${intentId.slice(0, 10)}...`);
    
    // Monitor for 60 seconds (intent deadline)
    setTimeout(() => {
      this.stopMonitoring(intentId, target);
    }, 60000);
    
    // Start monitoring events for this contract
    await this.monitorContractEvents(target, intentId);
  }
  
  async monitorContractEvents(target, intentId) {
    try {
      // Get the contract interface to monitor all events
      const contract = new ethers.Contract(target, [], this.provider);
      
      // Listen for any events from the target contract
      const filter = {
        address: target,
        fromBlock: 'latest'
      };
      
      this.provider.on(filter, async (log) => {
        await this.handleStateChange(intentId, target, log);
      });
      
      // Also monitor balance changes
      this.monitorBalanceChanges(target, intentId);
      
    } catch (error) {
      console.error(`❌ Failed to set up monitoring for ${target}:`, error.message);
    }
  }
  
  async monitorBalanceChanges(target, intentId) {
    try {
      const initialBalance = await this.provider.getBalance(target);
      
      const checkBalance = async () => {
        if (!this.activeIntents.has(intentId)) return; // Stop if intent expired
        
        try {
          const currentBalance = await this.provider.getBalance(target);
          
          if (!currentBalance.eq(initialBalance)) {
            console.log(`💰 Balance change detected for ${target.slice(0, 10)}...`);
            console.log(`   From: ${ethers.utils.formatEther(initialBalance)} ETH`);
            console.log(`   To: ${ethers.utils.formatEther(currentBalance)} ETH`);
            
            await this.flagStateChange(intentId, target, 'balance_change');
          }
        } catch (error) {
          console.error(`❌ Balance check failed:`, error.message);
        }
        
        // Check again in 5 seconds
        setTimeout(checkBalance, 5000);
      };
      
      setTimeout(checkBalance, 5000);
      
    } catch (error) {
      console.error(`❌ Failed to monitor balance for ${target}:`, error.message);
    }
  }
  
  async handleStateChange(intentId, target, log) {
    if (!this.activeIntents.has(intentId)) return;
    
    const monitorData = this.activeIntents.get(intentId);
    monitorData.eventCount++;
    
    console.log(`⚠️  STATE CHANGE DETECTED for intent ${intentId.slice(0, 10)}`);
    console.log(`   Contract: ${target.slice(0, 10)}...`);
    console.log(`   Block: ${log.blockNumber}`);
    console.log(`   Tx: ${log.transactionHash}`);
    console.log(`   Event count: ${monitorData.eventCount}`);
    
    await this.flagStateChange(intentId, target, 'event_emitted');
  }
  
  async flagStateChange(intentId, target, changeType) {
    try {
      console.log(`🚩 Flagging state change in contract for intent ${intentId.slice(0, 10)}...`);
      
      const tx = await this.vigilantContract.flagStateChange(intentId, target, {
        gasLimit: 200000
      });
      
      await tx.wait();
      
      console.log(`✅ State change flagged successfully (${changeType})`);
      
      // Emit custom event for frontend
      this.emitStateChangeAlert(intentId, target, changeType);
      
    } catch (error) {
      console.error(`❌ Failed to flag state change:`, error.message);
    }
  }
  
  emitStateChangeAlert(intentId, target, changeType) {
    const alert = {
      timestamp: new Date().toISOString(),
      intentId: intentId.slice(0, 10),
      target: target.slice(0, 10),
      changeType,
      severity: 'HIGH',
      message: `State change detected in monitored contract`
    };
    
    console.log(`🚨 ALERT: ${JSON.stringify(alert, null, 2)}`);
  }
  
  stopMonitoring(intentId, target) {
    if (this.activeIntents.has(intentId)) {
      const monitorData = this.activeIntents.get(intentId);
      const duration = (Date.now() - monitorData.startTime) / 1000;
      
      console.log(`⏹️  Stopped monitoring intent ${intentId.slice(0, 10)} after ${duration}s (${monitorData.eventCount} events)`);
      
      this.activeIntents.delete(intentId);
    }
  }
  
  setupWebSocketMonitoring() {
    // Set up WebSocket server for real-time communication with frontend
    const wss = new WebSocket.Server({ port: process.env.WS_PORT || 3002 });
    
    wss.on('connection', (ws) => {
      console.log('📡 Frontend connected to state monitor');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('📥 Received from frontend:', data);
        } catch (error) {
          console.error('❌ Invalid WebSocket message:', error.message);
        }
      });
      
      ws.on('close', () => {
        console.log('📡 Frontend disconnected from state monitor');
      });
      
      // Send initial status
      ws.send(JSON.stringify({
        type: 'status',
        activeIntents: this.activeIntents.size,
        monitoredContracts: this.monitoredContracts.size
      }));
    });
    
    console.log(`📡 WebSocket server running on port ${process.env.WS_PORT || 3002}`);
  }
  
  // Method to get current monitoring status
  getStatus() {
    return {
      activeIntents: Array.from(this.activeIntents.entries()).map(([id, data]) => ({
        intentId: id.slice(0, 10),
        target: data.target.slice(0, 10),
        duration: (Date.now() - data.startTime) / 1000,
        eventCount: data.eventCount
      })),
      monitoredContracts: Array.from(this.monitoredContracts).map(addr => addr.slice(0, 10))
    };
  }
}

// Export for use in other modules
export default StateMonitor;

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.MONITOR_KEY) {
    console.error('❌ MONITOR_KEY environment variable not set');
    process.exit(1);
  }

  async function main() {
    const monitor = new StateMonitor(
      process.env.VIGILANT_ADDRESS,
      process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network',
      process.env.MONITOR_KEY
    );
    
    await monitor.start();
    
    // Log status every 30 seconds
    setInterval(() => {
      const status = monitor.getStatus();
      if (status.activeIntents.length > 0) {
        console.log(`\n📊 Monitor Status: ${status.activeIntents.length} active intents, ${status.monitoredContracts.length} contracts`);
      }
    }, 30000);
  }

  main().catch(console.error);
}