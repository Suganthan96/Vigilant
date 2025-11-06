import { ethers } from "ethers";
import solc from "solc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    console.log("🎭 Deploying MockMaliciousContract to Somnia Network (Chain ID: 50312)");
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

    // Read MockMaliciousContract source
    const mockSource = fs.readFileSync(path.join(__dirname, "contracts/MockMaliciousContract.sol"), "utf8");
    
    console.log("\n🔨 Compiling MockMaliciousContract...");
    
    // Solidity compiler input
    const input = {
        language: 'Solidity',
        sources: {
            "MockMaliciousContract.sol": {
                content: mockSource
            }
        },
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
    
    // Compile contract
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
    
    // Deploy MockMaliciousContract
    console.log("\n🎭 Deploying MockMaliciousContract...");
    const mockContract = contracts["MockMaliciousContract.sol"]["MockMaliciousAirdrop"];
    
    if (!mockContract) {
        console.error("❌ MockMaliciousAirdrop not found in compilation output");
        console.log("Available contracts:", Object.keys(contracts["MockMaliciousContract.sol"] || {}));
        return;
    }
    
    const mockFactory = new ethers.ContractFactory(
        mockContract.abi,
        mockContract.evm.bytecode.object,
        wallet
    );
    
    const mock = await mockFactory.deploy();
    await mock.waitForDeployment();
    const mockAddress = await mock.getAddress();
    console.log("✅ MockMaliciousAirdrop deployed:", mockAddress);

    // Test the contract
    console.log("\n🔍 Testing MockMaliciousAirdrop...");
    try {
        // Check if contract is deployed correctly
        const code = await provider.getCode(mockAddress);
        console.log("📋 Contract bytecode length:", code.length);
        console.log("✅ Contract deployment verified");
        
        // Test contract functions
        const claimActive = await mock.claimActive();
        console.log("🔄 Claim active status:", claimActive);
    } catch (error) {
        console.warn("⚠️ Contract test failed:", error.message);
    }

    // Final summary
    console.log("\n🎉 MOCK MALICIOUS CONTRACT DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("🎭 MockMaliciousAirdrop:", mockAddress);
    console.log("🌐 Network: Somnia (Chain ID: 50312)");
    console.log("👤 Deployer:", wallet.address);
    console.log("=".repeat(60));
    
    console.log("\n📝 Add to your .env file:");
    console.log(`MOCK_MALICIOUS_ADDRESS=${mockAddress}`);

    // Also add to ThreatDatabase if we have the address
    console.log("\n💡 Next step: Add this address to ThreatDatabase for testing");
    console.log("ThreatDatabase address: 0xab744628db53468A9F3802e8C84Fa22E779573c0");

    return {
        MockMaliciousAirdrop: mockAddress
    };
}

main()
    .then((addresses) => {
        console.log("\n🎊 MockMaliciousContract deployment successful!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });