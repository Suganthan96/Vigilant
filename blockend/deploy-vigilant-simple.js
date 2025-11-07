import fs from 'fs';
import solc from 'solc';
import { ethers } from 'ethers';

// Configuration
const PRIVATE_KEY = "9c6b29224b212ac74ec2b9e8f872a5b0788bf8824c94ff0887d93eb4ed98ce61";
const RPC_URL = "https://dream-rpc.somnia.network";
const CHAIN_ID = 50312;

async function deployVigilantSimple() {
    console.log('🚀 Deploying VigilantSimple contract...');
    
    try {
        // Read contract source
        const contractSource = fs.readFileSync('./contracts/VigilantSimple.sol', 'utf8');
        
        // Compile contract
        const input = {
            language: 'Solidity',
            sources: {
                'VigilantSimple.sol': {
                    content: contractSource
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode']
                    }
                }
            }
        };
        
        console.log('📝 Compiling contract...');
        const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
        
        if (compiled.errors) {
            compiled.errors.forEach(error => {
                if (error.severity === 'error') {
                    console.error('❌ Compilation error:', error.formattedMessage);
                    process.exit(1);
                } else {
                    console.warn('⚠️ Warning:', error.formattedMessage);
                }
            });
        }
        
        const contract = compiled.contracts['VigilantSimple.sol']['VigilantSimple'];
        
        if (!contract) {
            console.error('❌ Contract not found in compilation output');
            process.exit(1);
        }
        
        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        console.log('📡 Connected to Somnia Network');
        console.log('👛 Deployer address:', wallet.address);
        
        // Get balance
        const balance = await wallet.provider.getBalance(wallet.address);
        console.log('💰 Balance:', ethers.formatEther(balance), 'Somnia tokens');
        
        // Deploy contract
        const contractFactory = new ethers.ContractFactory(
            contract.abi,
            contract.evm.bytecode.object,
            wallet
        );
        
        console.log('🚀 Deploying VigilantSimple...');
        
        // Get current gas price from network
        const feeData = await provider.getFeeData();
        console.log('⛽ Network gas price:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'gwei');
        
        const deployedContract = await contractFactory.deploy({
            gasLimit: 1200000,  // Further reduced gas limit
            gasPrice: feeData.gasPrice || ethers.parseUnits('1', 'gwei')  // Fallback gas price
        });
        
        console.log('⏳ Waiting for deployment confirmation...');
        console.log('📋 Transaction hash:', deployedContract.deploymentTransaction().hash);
        
        try {
            await deployedContract.waitForDeployment();
        } catch (error) {
            console.error('❌ Deployment wait failed:', error.message);
            // Try to get the contract address anyway
            const contractAddress = await deployedContract.getAddress();
            console.log('📍 Contract Address (may not be deployed):', contractAddress);
            throw error;
        }
        
        const contractAddress = await deployedContract.getAddress();
        
        console.log('✅ VigilantSimple deployed successfully!');
        console.log('📍 Contract Address:', contractAddress);
        console.log('🔗 Transaction Hash:', deployedContract.deploymentTransaction().hash);
        
        // Test the contract
        console.log('\n🧪 Testing contract...');
        const fee = await deployedContract.VERIFICATION_FEE();
        const minSimulators = await deployedContract.MIN_SIMULATORS();
        
        console.log('💎 Verification Fee:', ethers.formatEther(fee), 'Somnia tokens');
        console.log('👥 Min Simulators:', minSimulators.toString());
        
        // Add deployer as authorized simulator for testing
        console.log('🔧 Adding deployer as authorized simulator...');
        const tx = await deployedContract.addSimulator(wallet.address);
        await tx.wait();
        console.log('✅ Simulator authorized');
        
        return {
            address: contractAddress,
            abi: contract.abi
        };
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Run deployment
deployVigilantSimple()
    .then(result => {
        console.log('\n🎉 Deployment completed!');
        console.log('🔧 Update your frontend with this address:');
        console.log(`NEXT_PUBLIC_VIGILANT_CONTRACT=${result.address}`);
        
        // Save contract info for frontend
        const contractInfo = {
            address: result.address,
            abi: result.abi,
            network: 'somnia',
            chainId: CHAIN_ID
        };
        
        fs.writeFileSync('./deployed-contract.json', JSON.stringify(contractInfo, null, 2));
        console.log('📄 Contract info saved to deployed-contract.json');
    })
    .catch(error => {
        console.error('💥 Deployment failed:', error);
        process.exit(1);
    });