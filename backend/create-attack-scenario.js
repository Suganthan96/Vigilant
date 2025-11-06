// contracts/scripts/create-attack-scenario.js
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createAttackScenario() {
    console.log('🎭 Creating attack scenarios for Vigilant demo...');
    
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network'
    );
    
    const attacker = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log(`🕵️  Attacker address: ${attacker.address}`);
    
    // Define comprehensive attack scenarios
    const attackScenarios = [
        {
            id: 1,
            name: 'Unlimited Approval Attack',
            description: 'User approves unlimited tokens to malicious contract',
            riskLevel: 80,
            category: 'Token Approval',
            targetFunction: 'approve(address,uint256)',
            callData: '0x095ea7b3' + '0'.repeat(64) + 'f'.repeat(64),
            expectedDetection: {
                simulator: true,
                gasAnalysis: false,
                opcodeAnalysis: false,
                approvalAnalysis: true,
                threatDb: false,
                mempool: false
            }
        },
        {
            id: 2,
            name: 'Airdrop Drain Attack',
            description: 'Malicious airdrop that switches to drain mode after simulation',
            riskLevel: 95,
            category: 'State Change',
            targetFunction: 'claim()',
            callData: '0x4e71d92d',
            expectedDetection: {
                simulator: false, // Passes simulation initially
                gasAnalysis: false,
                opcodeAnalysis: false,
                approvalAnalysis: false,
                threatDb: true, // Should be flagged after first attack
                mempool: false
            }
        },
        {
            id: 3,
            name: 'Sandwich Attack',
            description: 'MEV bot sandwich attack on DEX swap',
            riskLevel: 60,
            category: 'MEV',
            targetFunction: 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
            callData: '0x38ed1739',
            expectedDetection: {
                simulator: false,
                gasAnalysis: true,
                opcodeAnalysis: false,
                approvalAnalysis: false,
                threatDb: false,
                mempool: true // Should detect competing transactions
            }
        },
        {
            id: 4,
            name: 'Delegatecall Exploit',
            description: 'Contract using delegatecall to malicious implementation',
            riskLevel: 90,
            category: 'Opcode Exploit',
            targetFunction: 'delegateCall(address,bytes)',
            callData: '0xf4' + '0'.repeat(62), // Contains DELEGATECALL opcode
            expectedDetection: {
                simulator: true,
                gasAnalysis: false,
                opcodeAnalysis: true, // Should detect DELEGATECALL
                approvalAnalysis: false,
                threatDb: false,
                mempool: false
            }
        },
        {
            id: 5,
            name: 'Selfdestruct Bomb',
            description: 'Contract that selfdestructs and drains funds',
            riskLevel: 100,
            category: 'Opcode Exploit',
            targetFunction: 'destroy()',
            callData: '0xff' + '0'.repeat(62), // Contains SELFDESTRUCT opcode
            expectedDetection: {
                simulator: true,
                gasAnalysis: false,
                opcodeAnalysis: true, // Should detect SELFDESTRUCT
                approvalAnalysis: false,
                threatDb: false,
                mempool: false
            }
        },
        {
            id: 6,
            name: 'Gas Bomb Attack',
            description: 'Transaction designed to consume excessive gas',
            riskLevel: 70,
            category: 'Resource Exhaustion',
            targetFunction: 'gasBomb()',
            callData: '0x12345678',
            gasLimit: 2000000, // Very high gas limit
            expectedDetection: {
                simulator: false,
                gasAnalysis: true, // Should detect high gas usage
                opcodeAnalysis: false,
                approvalAnalysis: false,
                threatDb: false,
                mempool: false
            }
        }
    ];
    
    console.log('\n🎯 Available attack scenarios:');
    
    attackScenarios.forEach((scenario, index) => {
        console.log(`\n   ${scenario.id}. ${scenario.name}`);
        console.log(`      Category: ${scenario.category}`);
        console.log(`      Description: ${scenario.description}`);
        console.log(`      Risk Level: ${scenario.riskLevel}/100`);
        console.log(`      Function: ${scenario.targetFunction}`);
        console.log(`      Call Data: ${scenario.callData}`);
        
        const detections = Object.entries(scenario.expectedDetection)
            .filter(([_, detected]) => detected)
            .map(([method, _]) => method);
        
        console.log(`      Expected Detection: ${detections.join(', ') || 'None (bypass attempt)'}`);
    });
    
    // Generate test transaction intents
    const testIntents = attackScenarios.map(scenario => ({
        id: scenario.id,
        target: process.env.THREAT_DB_ADDRESS || '0x' + '1'.repeat(40),
        callData: scenario.callData,
        value: '0',
        gasLimit: scenario.gasLimit || 500000,
        description: scenario.name,
        riskLevel: scenario.riskLevel
    }));
    
    // Save attack scenarios to file
    const scenarioData = {
        timestamp: new Date().toISOString(),
        network: 'Somnia Devnet',
        attacker: attacker.address,
        scenarios: attackScenarios,
        testIntents: testIntents,
        instructions: {
            setup: 'Deploy MockMaliciousContract first',
            testing: 'Submit intents through Vigilant contract',
            monitoring: 'Watch simulator responses and risk scores'
        }
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'attack-scenarios.json'),
        JSON.stringify(scenarioData, null, 2)
    );
    
    console.log('\n📄 Attack scenarios saved to attack-scenarios.json');
    console.log('✅ Attack scenarios ready for testing');
    console.log('\n💡 Testing Instructions:');
    console.log('   1. Deploy contracts: node deploy.js');
    console.log('   2. Setup simulators: node setup-simulators.js');
    console.log('   3. Start backend services: cd ../backend && npm run services');
    console.log('   4. Submit test intents through the frontend or directly to contract');
    
    return scenarioData;
}

// Generate specific attack transaction
async function generateAttackTransaction(scenarioId) {
    const scenarios = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'attack-scenarios.json'), 'utf8')
    );
    
    const scenario = scenarios.scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
        console.error(`❌ Scenario ${scenarioId} not found`);
        return;
    }
    
    console.log(`🎯 Generating attack transaction for: ${scenario.name}`);
    
    const txData = {
        to: process.env.VIGILANT_ADDRESS || '0x' + '2'.repeat(40),
        data: ethers.utils.defaultAbiCoder.encode(
            ['address', 'bytes', 'uint256'],
            [
                process.env.THREAT_DB_ADDRESS || '0x' + '1'.repeat(40), // target
                scenario.callData, // call data
                0 // value
            ]
        ),
        value: ethers.utils.parseEther('0.001'), // Verification fee
        gasLimit: 500000
    };
    
    console.log('📋 Transaction Data:');
    console.log(`   To: ${txData.to}`);
    console.log(`   Data: ${txData.data}`);
    console.log(`   Value: ${ethers.utils.formatEther(txData.value)} ETH`);
    console.log(`   Gas Limit: ${txData.gasLimit}`);
    
    return txData;
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    const scenarioId = parseInt(process.argv[3]);
    
    if (command === 'generate' && scenarioId) {
        generateAttackTransaction(scenarioId).catch(console.error);
    } else {
        createAttackScenario().catch(console.error);
    }
}

export { createAttackScenario, generateAttackTransaction };