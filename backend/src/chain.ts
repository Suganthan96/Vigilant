/**
 * Somnia Network Chain Definition
 * Chain configuration for Vigilant MEV Protection system
 */

import { defineChain } from 'viem'

export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Network',
  network: 'somnia-testnet',
  nativeCurrency: { 
    name: 'STT', 
    symbol: 'STT', 
    decimals: 18 
  },
  rpcUrls: {
    default: { 
      http: ['https://dream-rpc.somnia.network'] 
    },
    public: { 
      http: ['https://dream-rpc.somnia.network'] 
    }
  },
  blockExplorers: {
    default: { 
      name: 'Somnia Explorer', 
      url: 'https://explorer.somnia.network' 
    }
  }
} as const)

export default somniaTestnet