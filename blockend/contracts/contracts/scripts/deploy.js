const { ethers } = require("hardhat");

async function main() {
    console.log("Starting Vigilant deployment...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);
    
    // Deploy ThreatDatabase
    const ThreatDatabase = await ethers.getContractFactory("ThreatDatabase");
    const threatDatabase = await ThreatDatabase.deploy();
    await threatDatabase.waitForDeployment();
    const threatDbAddress = await threatDatabase.getAddress();
    console.log("ThreatDatabase:", threatDbAddress);
    
    // Deploy Vigilant
    const Vigilant = await ethers.getContractFactory("Vigilant");
    const vigilant = await Vigilant.deploy(threatDbAddress);
    await vigilant.waitForDeployment();
    const vigilantAddress = await vigilant.getAddress();
    console.log("Vigilant:", vigilantAddress);
    
    // Authorize Vigilant
    await threatDatabase.authorizeReporter(vigilantAddress);
    console.log("Vigilant authorized");
    
    // Deploy Mock Contract
    const MockContract = await ethers.getContractFactory("MockMaliciousContract");
    const mockContract = await MockContract.deploy();
    await mockContract.waitForDeployment();
    const mockAddress = await mockContract.getAddress();
    console.log("MockContract:", mockAddress);
    
    console.log("Deployment complete!");
}

main().catch(console.error);
