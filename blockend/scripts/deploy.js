import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
    console.log("🚀 Starting Vigilant Protocol deployment to Somnia Network...");
    console.log("=".repeat(60));
    
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying from account:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.1")) {
        console.warn("⚠️  Warning: Low balance. Make sure you have enough ETH for deployment.");
    }
    
    console.log("\n📊 Deploying ThreatDatabase...");
    // Deploy ThreatDatabase first
    const ThreatDatabase = await hre.ethers.getContractFactory("ThreatDatabase");
    const threatDatabase = await ThreatDatabase.deploy();
    await threatDatabase.waitForDeployment();
    const threatDbAddress = await threatDatabase.getAddress();
    console.log("✅ ThreatDatabase deployed to:", threatDbAddress);
    
    console.log("\n🛡️ Deploying Vigilant main contract...");
    // Deploy Vigilant main contract
    const Vigilant = await hre.ethers.getContractFactory("Vigilant");
    const vigilant = await Vigilant.deploy();
    await vigilant.waitForDeployment();
    const vigilantAddress = await vigilant.getAddress();
    console.log("✅ Vigilant deployed to:", vigilantAddress);
    
    console.log("\n🎭 Deploying MockMaliciousContract for testing...");
    // Deploy MockMaliciousContract for testing
    const MockMaliciousContract = await hre.ethers.getContractFactory("MockMaliciousContract");
    const mockContract = await MockMaliciousContract.deploy();
    await mockContract.waitForDeployment();
    const mockAddress = await mockContract.getAddress();
    console.log("✅ MockMaliciousContract deployed to:", mockAddress);
    
    console.log("\n⚠️ Adding mock contract to threat database...");
    // Add mock contract to threat database for testing
    const reportTx = await threatDatabase.reportThreat(
        mockAddress,
        "Test malicious contract for demonstration"
    );
    await reportTx.wait();
    console.log("✅ Mock contract added to threat database");
    
    // Verify deployments
    console.log("\n🔍 Verifying contract functionality...");
    
    // Test ThreatDatabase
    const threatScore = await threatDatabase.getThreatScore(mockAddress);
    console.log("📊 Mock contract threat score:", threatScore.toString());
    
    // Test Vigilant contract
    const insurancePool = await vigilant.getInsurancePool();
    console.log("💰 Insurance pool balance:", ethers.formatEther(insurancePool), "ETH");
    
    const activeSimulators = await vigilant.activeSimulators();
    console.log("🤖 Active simulators:", activeSimulators.toString());
    
    // Display final deployment summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("=".repeat(60));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("🌐 Network: Somnia (Chain ID: 50312)");
    console.log("👤 Deployer:", deployer.address);
    console.log("📊 ThreatDatabase:", threatDbAddress);
    console.log("🛡️ Vigilant:", vigilantAddress);
    console.log("🎭 MockMaliciousContract:", mockAddress);
    console.log("=".repeat(60));
    
    // Save deployment addresses to file
    const deploymentInfo = {
        network: "somnia",
        chainId: 50312,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            ThreatDatabase: threatDbAddress,
            Vigilant: vigilantAddress,
            MockMaliciousContract: mockAddress
        },
        transactionHashes: {
            ThreatDatabase: threatDatabase.deploymentTransaction().hash,
            Vigilant: vigilant.deploymentTransaction().hash,
            MockMaliciousContract: mockContract.deploymentTransaction().hash
        }
    };
    
    console.log("\n📄 Deployment details:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n✅ Next steps:");
    console.log("1. Update backend/.env with contract addresses:");
    console.log(`   VIGILANT_ADDRESS=${vigilantAddress}`);
    console.log(`   THREAT_DB_ADDRESS=${threatDbAddress}`);
    console.log(`   MOCK_MALICIOUS_ADDRESS=${mockAddress}`);
    console.log("2. Start simulator nodes");
    console.log("3. Test transaction submission through frontend");
    
    return deploymentInfo;
}

// Execute deployment
main()
    .then((info) => {
        console.log("\n🎊 Deployment script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });