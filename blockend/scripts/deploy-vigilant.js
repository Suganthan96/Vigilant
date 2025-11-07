import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log('🚀 Deploying VigilantSimple contract...');
    
    // Get the contract factory
    const VigilantSimple = await ethers.getContractFactory("VigilantSimple");
    
    // Get deployer info
    const [deployer] = await ethers.getSigners();
    console.log('👛 Deploying with account:', deployer.address);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log('💰 Account balance:', ethers.formatEther(balance), 'ETH');
    
    // Deploy the contract
    console.log('🚀 Deploying VigilantSimple...');
    const vigilantSimple = await VigilantSimple.deploy();
    
    console.log('⏳ Waiting for deployment confirmation...');
    await vigilantSimple.waitForDeployment();
    
    const contractAddress = await vigilantSimple.getAddress();
    
    console.log('✅ VigilantSimple deployed successfully!');
    console.log('📍 Contract Address:', contractAddress);
    
    // Test basic functionality
    console.log('\n🧪 Testing contract...');
    const verificationFee = await vigilantSimple.VERIFICATION_FEE();
    const minSimulators = await vigilantSimple.MIN_SIMULATORS();
    
    console.log('💎 Verification Fee:', ethers.formatEther(verificationFee), 'ETH');
    console.log('👥 Min Simulators:', minSimulators.toString());
    
    // Add deployer as authorized simulator for testing
    console.log('🔧 Adding deployer as authorized simulator...');
    await vigilantSimple.addSimulator(deployer.address);
    console.log('✅ Simulator authorized');
    
    console.log('\n🎉 Deployment completed!');
    console.log('🔧 Update your frontend with this address:');
    console.log(`NEXT_PUBLIC_VIGILANT_CONTRACT=${contractAddress}`);
    
    return {
        address: contractAddress,
        contract: vigilantSimple
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Deployment failed:', error);
        process.exit(1);
    });