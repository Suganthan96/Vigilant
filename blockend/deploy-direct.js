import { ethers } from "ethers";
import solc from "solc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Contract source codes
const contracts = {
    "ThreatDatabase.sol": {
        content: fs.readFileSync(path.join(__dirname, "contracts/ThreatDatabase.sol"), "utf8")
    },
    "Vigilant.sol": {
        content: fs.readFileSync(path.join(__dirname, "contracts/Vigilant.sol"), "utf8")
    },
    "MockMaliciousContract.sol": {
        content: fs.readFileSync(path.join(__dirname, "contracts/MockMaliciousContract.sol"), "utf8")
    }
};

// Solidity compiler input
const input = {
    language: 'Solidity',
    sources: contracts,
    settings: {
        outputSelection: {
            '*': {
                '*': ['abi', 'evm.bytecode']
            }
        },
        optimizer: {
            enabled: true,
            runs: 200
        }
    }
};

async function main() {
    console.log("🚀 Direct deployment to Somnia Network (Chain ID: 50312)");
    console.log("=".repeat(60));

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
    const privateKey = "9c6b29224b212ac74ec2b9e8f872a5b0788bf8824c94ff0887d93eb4ed98ce61";
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("📝 Deploying from:", wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
        console.error("❌ Insufficient balance for deployment");
        return;
    }

    console.log("\n🔨 Compiling contracts...");
    
    // Compile contracts
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
        console.log("⚠️ Compilation warnings/errors:");
        output.errors.forEach(error => {
            if (error.severity === 'error') {
                console.error("❌", error.formattedMessage);
                return;
            }
            console.warn("⚠️", error.formattedMessage);
        });
    }

    const contracts = output.contracts;
    
    // Deploy ThreatDatabase
    console.log("\n📊 Deploying ThreatDatabase...");
    const threatDbContract = contracts["ThreatDatabase.sol"]["ThreatDatabase"];
    const threatDbFactory = new ethers.ContractFactory(
        threatDbContract.abi,
        threatDbContract.evm.bytecode.object,
        wallet
    );
    
    const threatDatabase = await threatDbFactory.deploy();
    await threatDatabase.waitForDeployment();
    const threatDbAddress = await threatDatabase.getAddress();
    console.log("✅ ThreatDatabase deployed:", threatDbAddress);

    // Deploy Vigilant
    console.log("\n🛡️ Deploying Vigilant...");
    const vigilantContract = contracts["Vigilant.sol"]["Vigilant"];
    const vigilantFactory = new ethers.ContractFactory(
        vigilantContract.abi,
        vigilantContract.evm.bytecode.object,
        wallet
    );
    
    const vigilant = await vigilantFactory.deploy();
    await vigilant.waitForDeployment();
    const vigilantAddress = await vigilant.getAddress();
    console.log("✅ Vigilant deployed:", vigilantAddress);

    // Deploy MockMaliciousContract
    console.log("\n🎭 Deploying MockMaliciousContract...");
    const mockContractData = contracts["MockMaliciousContract.sol"]["MockMaliciousContract"];
    if (!mockContractData) {
        console.warn("⚠️ MockMaliciousContract not found in compilation output, skipping...");
        mockAddress = "Not deployed";
    } else {
        const mockFactory = new ethers.ContractFactory(
            mockContractData.abi,
            mockContractData.evm.bytecode.object,
            wallet
        );
        
        const mock = await mockFactory.deploy();
        await mock.waitForDeployment();
        var mockAddress = await mock.getAddress();
        console.log("✅ MockMaliciousContract deployed:", mockAddress);
    }

    // Test contracts
    console.log("\n🔍 Testing deployments...");
    try {
        const insurancePool = await vigilant.getInsurancePool();
        console.log("💰 Vigilant insurance pool:", ethers.formatEther(insurancePool), "ETH");
        
        const activeSimulators = await vigilant.activeSimulators();
        console.log("🤖 Active simulators:", activeSimulators.toString());
    } catch (error) {
        console.warn("⚠️ Contract test failed:", error.message);
    }

    // Final summary
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("📋 Contract Addresses:");
    console.log("🔗 ThreatDatabase:", threatDbAddress);
    console.log("🔗 Vigilant:", vigilantAddress);
    console.log("🔗 MockMaliciousContract:", mockAddress);
    console.log("=".repeat(60));
    
    console.log("\n📝 Update your .env file:");
    console.log(`VIGILANT_ADDRESS=${vigilantAddress}`);
    console.log(`THREAT_DB_ADDRESS=${threatDbAddress}`);
    console.log(`MOCK_MALICIOUS_ADDRESS=${mockAddress}`);

    return {
        ThreatDatabase: threatDbAddress,
        Vigilant: vigilantAddress,
        MockMaliciousContract: mockAddress
    };
}

main()
    .then((addresses) => {
        console.log("\n🎊 Deployment successful!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });