import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test"
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 1337
    },
    somnia: {
      type: "http",
      url: "https://dream-rpc.somnia.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 50312,
      gasPrice: 20000000000, // 20 gwei
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 1337
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  }
};