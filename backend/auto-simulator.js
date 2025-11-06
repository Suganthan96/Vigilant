const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const RPC_URL = "https://dream-rpc.somnia.network";
const VIGILANT_ADDRESS = "0x0b1Cd4df8E32Fc97022F54D1671F5f49b8549852";
const SIMULATOR_KEYS = [
    "9c6b29224b212ac74ec2b9e8f872a5b0788bf8824c94ff0887d93eb4ed98ce61", // Simulator 1
    "9c6b29224b212ac74ec2b9e8f872a5b0788bf8824c94ff0887d93eb4ed98ce61", // Simulator 2  
    "9c6b29224b212ac74ec2b9e8f872a5b0788bf8824c94ff0887d93eb4ed98ce61"  // Simulator 3
];

const VIGILANT_ABI = [
    "function registerSimulator() external payable",
    "function submitSimulation(bytes32 intentId, bool isRisky, uint256 riskScore) external",
    "function activeSimulators() external view returns (uint256)",
    "event IntentSubmitted(bytes32 indexed intentId, address indexed user, address target, uint256 timestamp)"
];

class AutoSimulator {
    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        this.simulators = [];
        this.contract = new ethers.Contract(VIGILANT_ADDRESS, VIGILANT_ABI, this.provider);
        
        // Create simulator wallets
        SIMULATOR_KEYS.forEach((key, index) => {
            const wallet = new ethers.Wallet(key, this.provider);
            const contract = new ethers.Contract(VIGILANT_ADDRESS, VIGILANT_ABI, wallet);
            this.simulators.push({ wallet, contract, index });
        });
    }

    async registerAllSimulators() {
        console.log('🤖 Auto-registering simulators...');
        
        for (let i = 0; i < this.simulators.length; i++) {
            try {
                const { wallet, contract } = this.simulators[i];
                
                console.log(`📝 Registering simulator ${i + 1}:`, wallet.address);
                
                const tx = await contract.registerSimulator({
                    value: ethers.utils.parseEther("10"), // 10 ETH stake
                    gasLimit: 300000
                });
                
                await tx.wait();
                console.log(`✅ Simulator ${i + 1} registered:`, tx.hash);
                
            } catch (error) {
                console.log(`⚠️ Simulator ${i + 1} registration failed:`, error.message);
            }
        }
        
        // Check final count
        const count = await this.contract.activeSimulators();
        console.log('🎯 Total active simulators:', count.toString());
    }

    async startListening() {
        console.log('👂 Starting intent listener...');
        
        this.contract.on('IntentSubmitted', async (intentId, user, target, timestamp) => {
            console.log('🚨 New intent detected:', intentId);
            console.log('👤 User:', user);
            console.log('🎯 Target:', target);
            
            await this.simulateIntent(intentId);
        });
    }

    async simulateIntent(intentId) {
        console.log('🔍 Simulating intent:', intentId);
        
        // Simulate with all 3 simulators
        for (let i = 0; i < this.simulators.length; i++) {
            try {
                const { contract } = this.simulators[i];
                
                // Random risk assessment (for demo - always safe)
                const isRisky = false; // Math.random() > 0.8; // 20% chance risky
                const riskScore = Math.floor(Math.random() * 20); // Low risk score
                
                console.log(`🤖 Simulator ${i + 1} analyzing... Risk: ${riskScore}`);
                
                const tx = await contract.submitSimulation(
                    intentId,
                    isRisky,
                    riskScore,
                    { gasLimit: 200000 }
                );
                
                await tx.wait();
                console.log(`✅ Simulator ${i + 1} submitted result:`, tx.hash);
                
            } catch (error) {
                console.error(`❌ Simulator ${i + 1} failed:`, error.message);
            }
        }
        
        console.log('🎉 All simulators completed analysis for:', intentId);
    }

    async checkStatus() {
        const count = await this.contract.activeSimulators();
        console.log('📊 Active simulators:', count.toString());
        return count.toNumber();
    }
}

async function main() {
    const autoSim = new AutoSimulator();
    
    try {
        // Check current status
        const count = await autoSim.checkStatus();
        
        if (count < 3) {
            console.log('🚀 Need to register simulators...');
            await autoSim.registerAllSimulators();
        } else {
            console.log('✅ Sufficient simulators already active');
        }
        
        // Start listening for intents
        await autoSim.startListening();
        console.log('🎯 Auto-simulator service running...');
        
    } catch (error) {
        console.error('💥 Auto-simulator failed:', error);
    }
}

main().catch(console.error);