import ethers from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Test the simulator system
async function testSimulator() {
    console.log('🧪 Testing Simulator System...');
    
    try {
        // Test ethers connection
        const provider = new ethers.providers.JsonRpcProvider(
            process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network'
        );
        
        const blockNumber = await provider.getBlockNumber();
        console.log('✅ Connected to Somnia Network, block:', blockNumber);
        
        // Test wallet
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        console.log('✅ Wallet address:', wallet.address);
        
        const balance = await wallet.getBalance();
        console.log('✅ Balance:', ethers.utils.formatEther(balance), 'tokens');
        
        // Test contract connection
        const contractAddress = process.env.VIGILANT_SIMPLE_ADDRESS || '0x0a85B911247995B6CC664BE84cDa6FDE9dE63F24';
        
        const abi = [
            "function authorizedSimulators(address) view returns (bool)",
            "function addSimulator(address simulator)",
            "event IntentSubmitted(bytes32 indexed intentId, address indexed user, address indexed target, bytes32 stateSnapshot, uint256 timestamp)"
        ];
        
        const contract = new ethers.Contract(contractAddress, abi, wallet);
        
        // Check if authorized
        const isAuthorized = await contract.authorizedSimulators(wallet.address);
        console.log('✅ Is authorized simulator:', isAuthorized);
        
        if (!isAuthorized) {
            console.log('📝 Authorizing simulator...');
            try {
                const tx = await contract.addSimulator(wallet.address);
                await tx.wait();
                console.log('✅ Simulator authorized successfully');
            } catch (error) {
                console.log('⚠️ Authorization failed (may already be authorized):', error.message);
            }
        }
        
        console.log('🎉 Simulator system test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSimulator();