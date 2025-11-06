// contracts/scripts/setup-simulators.js
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupSimulators() {
    console.log('🔧 Setting up Vigilant simulator nodes...');
    
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network'
    );
    
    const simulatorKeys = [
        process.env.SIMULATOR_1_KEY,
        process.env.SIMULATOR_2_KEY,
        process.env.SIMULATOR_3_KEY
    ].filter(Boolean);
    
    if (simulatorKeys.length < 3) {
        console.error('❌ Need at least 3 simulator keys in .env file');
        console.log('💡 Add these to backend/.env:');
        console.log('   SIMULATOR_1_KEY=0x...');
        console.log('   SIMULATOR_2_KEY=0x...');
        console.log('   SIMULATOR_3_KEY=0x...');
        return;
    }
    
    console.log(`📊 Checking ${simulatorKeys.length} simulator wallets...`);
    
    const simulatorInfo = [];
    
    for (let i = 0; i < simulatorKeys.length; i++) {
        try {
            const wallet = new ethers.Wallet(simulatorKeys[i], provider);
            const balance = await wallet.getBalance();
            
            const info = {
                id: i + 1,
                address: wallet.address,
                balance: ethers.utils.formatEther(balance),
                ready: balance.gte(ethers.utils.parseEther('10'))
            };
            
            simulatorInfo.push(info);
            
            console.log(`\n🔍 Simulator ${i + 1}:`);
            console.log(`   Address: ${wallet.address}`);
            console.log(`   Balance: ${info.balance} ETH`);
            
            if (info.ready) {
                console.log(`   ✅ Ready for staking (10 ETH minimum)`);
            } else {
                console.log(`   ⚠️  Insufficient balance for staking (need 10 ETH)`);
                console.log(`   💡 Send ETH to: ${wallet.address}`);
            }
            
        } catch (error) {
            console.error(`❌ Error checking simulator ${i + 1}:`, error.message);
        }
    }
    
    // Check contract addresses
    console.log('\n📋 Contract Configuration:');
    const vigilantAddress = process.env.VIGILANT_ADDRESS;
    const threatDbAddress = process.env.THREAT_DB_ADDRESS;
    
    if (vigilantAddress && vigilantAddress !== '0x1234567890123456789012345678901234567890') {
        console.log(`✅ Vigilant Contract: ${vigilantAddress}`);
    } else {
        console.log(`⚠️  Vigilant Contract: Not deployed (run deploy script first)`);
    }
    
    if (threatDbAddress && threatDbAddress !== '0x0987654321098765432109876543210987654321') {
        console.log(`✅ ThreatDB Contract: ${threatDbAddress}`);
    } else {
        console.log(`⚠️  ThreatDB Contract: Not deployed (run deploy script first)`);
    }
    
    // Generate simulator configuration
    const config = {
        timestamp: new Date().toISOString(),
        network: {
            name: 'Somnia Devnet',
            rpc: process.env.SOMNIA_RPC,
            chainId: 50311
        },
        contracts: {
            vigilant: vigilantAddress,
            threatDb: threatDbAddress
        },
        simulators: simulatorInfo
    };
    
    // Save configuration
    fs.writeFileSync(
        path.join(__dirname, 'simulator-config.json'),
        JSON.stringify(config, null, 2)
    );
    
    console.log('\n� Simulator configuration saved to simulator-config.json');
    
    const readyCount = simulatorInfo.filter(s => s.ready).length;
    console.log(`\n📊 Summary: ${readyCount}/${simulatorInfo.length} simulators ready`);
    
    if (readyCount >= 3) {
        console.log('✅ Sufficient simulators ready for launch');
        console.log('💡 To start simulators: cd backend && npm run simulator');
    } else {
        console.log('⚠️  Need at least 3 funded simulators to run Vigilant');
        console.log('💰 Fund the simulator wallets with 10+ ETH each');
    }
    
    return config;
}

// Generate new simulator keys if needed
function generateSimulatorKeys() {
    console.log('\n🔑 Generating new simulator keys...');
    
    const keys = [];
    for (let i = 1; i <= 3; i++) {
        const wallet = ethers.Wallet.createRandom();
        keys.push({
            id: i,
            privateKey: wallet.privateKey,
            address: wallet.address
        });
        
        console.log(`Simulator ${i}:`);
        console.log(`  Private Key: ${wallet.privateKey}`);
        console.log(`  Address: ${wallet.address}`);
    }
    
    console.log('\n📝 Add these to backend/.env:');
    keys.forEach(key => {
        console.log(`SIMULATOR_${key.id}_KEY=${key.privateKey}`);
    });
    
    return keys;
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    
    if (command === 'generate') {
        generateSimulatorKeys();
    } else {
        setupSimulators().catch(console.error);
    }
}

export { setupSimulators, generateSimulatorKeys };