'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http } from 'viem'
import { createConfig } from '@privy-io/wagmi'
import { mainnet, sepolia } from 'viem/chains'
import { useState } from 'react'

// Somnia Network Chain Configuration
const somniaNetwork = {
  id: 50311,
  name: 'Somnia Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://somnia-devnet.socialscan.io/',
    },
  },
} as const

// Wagmi Configuration
const config = createConfig({
  chains: [somniaNetwork, mainnet, sepolia],
  transports: {
    [somniaNetwork.id]: http('https://dream-rpc.somnia.network'),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

interface Web3ProvidersProps {
  children: React.ReactNode
}

export default function Web3Providers({ children }: Web3ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        refetchOnWindowFocus: false,
      },
    },
  }))
  
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  console.log('Privy App ID:', privyAppId ? 'Set' : 'Not set')
  console.log('Environment variables check:', {
    hasPrivyAppId: !!privyAppId,
    nodeEnv: process.env.NODE_ENV
  })

  if (!privyAppId) {
    return <div className="text-red-500 p-4">Error: NEXT_PUBLIC_PRIVY_APP_ID is not set</div>
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Customize Privy's appearance in your app
        appearance: {
          theme: 'dark',
          accentColor: '#f97316',
          showWalletLoginFirst: true,
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: somniaNetwork,
        supportedChains: [somniaNetwork, mainnet, sepolia],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}