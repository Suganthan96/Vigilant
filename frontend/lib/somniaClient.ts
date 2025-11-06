// Somnia Data Streams Client for Vigilant
import { SDK } from '@somnia-chain/streams'
import { createPublicClient, createWalletClient, http, webSocket } from 'viem'
import { defineChain } from 'viem'

// Somnia Network Chain Definition
export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Network',
  network: 'somnia-testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
    public: { http: ['https://dream-rpc.somnia.network'] },
  },
})

// Create clients for Somnia Data Streams
export const createSomniaClients = () => {
  // Public client with HTTP for most operations
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http('https://dream-rpc.somnia.network'),
  })

  // HTTP client for transactions
  const httpClient = createPublicClient({
    chain: somniaTestnet,
    transport: http('https://dream-rpc.somnia.network'),
  })

  return { publicClient, httpClient }
}

// Create wallet client for transactions (when wallet is connected)
export const createSomniaWalletClient = (provider: any) => {
  return createWalletClient({
    chain: somniaTestnet,
    transport: http('https://dream-rpc.somnia.network'),
    // Account will be set when wallet connects
  })
}

// Create Somnia Streams SDK instance
export const createStreamsSDK = (publicClient: any, walletClient?: any) => {
  return new SDK({
    public: publicClient,
    wallet: walletClient, // Optional for read-only operations
  })
}