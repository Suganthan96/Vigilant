const fs = require('fs');
const solc = require('solc');
const { ethers } = require('ethers');

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
                }
            });
        }
        
        const contract = compiled.contracts['VigilantSimple.sol']['VigilantSimple'];
        
        // Setup provider and wallet
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        console.log('📡 Connected to Somnia Network');
        console.log('👛 Deployer address:', wallet.address);
        
        // Get balance
        const balance = await wallet.getBalance();
        console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH');
        
        // Deploy contract
        const contractFactory = new ethers.ContractFactory(
            contract.abi,
            contract.evm.bytecode.object,
            wallet
        );
        
        console.log('🚀 Deploying VigilantSimple...');
        const deployedContract = await contractFactory.deploy({
            gasLimit: 3000000,
            gasPrice: ethers.utils.parseUnits('20', 'gwei')
        });
        
        console.log('⏳ Waiting for deployment confirmation...');
        await deployedContract.deployed();
        
        console.log('✅ VigilantSimple deployed successfully!');
        console.log('📍 Contract Address:', deployedContract.address);
        console.log('🔗 Transaction Hash:', deployedContract.deployTransaction.hash);
        
        // Test the contract
        console.log('\n🧪 Testing contract...');
        const fee = await deployedContract.VERIFICATION_FEE();
        console.log('💎 Verification Fee:', ethers.utils.formatEther(fee), 'ETH');
        
        return {
            address: deployedContract.address,
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
        console.log(`VIGILANT_SIMPLE_ADDRESS=${result.address}`);
    })
    .catch(error => {
        console.error('💥 Deployment failed:', error);
        process.exit(1);
    });