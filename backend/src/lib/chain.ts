import { defineChain } from 'viem'

/**
 * Somnia Testnet chain configuration
 * Chain ID: 50312
 * Native Currency: STT (Somnia Test Token)
 */
export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: { 
    name: 'STT', 
    symbol: 'STT', 
    decimals: 18 
  },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
    public: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network'
    }
  },
  testnet: true
} as const)