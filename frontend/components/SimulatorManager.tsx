"use client"

import { useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { createWalletClient, custom, parseEther } from 'viem'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Somnia chain definition
const somnia = {
  id: 50312,
  name: 'Somnia Network',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } }
}

const VIGILANT_ADDRESS = "0x5958E666C6D290F8325E2BC414588DC8D1E68963" as `0x${string}`

const SIMULATOR_ABI = [
  {
    name: 'registerSimulator',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: []
  },
  {
    name: 'simulatorStakes',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

export default function SimulatorManager() {
  const { wallets } = useWallets()
  const [isRegistering, setIsRegistering] = useState(false)
  const [status, setStatus] = useState('')

  const registerAsSimulator = async () => {
    if (!wallets[0]) {
      alert('Please connect wallet first')
      return
    }

    setIsRegistering(true)
    try {
      const provider = await wallets[0].getEthereumProvider()
      const walletClient = createWalletClient({
        chain: somnia,
        transport: custom(provider)
      })
      
      const [account] = await walletClient.getAddresses()
      
      // Register with minimum 10 ETH stake
      const hash = await walletClient.writeContract({
        address: VIGILANT_ADDRESS,
        abi: SIMULATOR_ABI,
        functionName: 'registerSimulator',
        value: parseEther("10"), // 10 ETH minimum stake
        account,
        gas: BigInt(300000)
      })
      
      setStatus(`Simulator registered! TX: ${hash}`)
      console.log('Simulator registered:', hash)
      
    } catch (error: any) {
      console.error('Registration failed:', error)
      setStatus(`Failed: ${error.message}`)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white">Simulator Registration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded">
          <p className="text-sm text-orange-400">
            <strong>Quick Fix:</strong> Register as simulator to enable consensus mechanism
          </p>
          <p className="text-xs text-orange-300/80 mt-1">
            Requires 10 ETH stake. You'll need to register 3 different wallets as simulators.
          </p>
        </div>
        
        <Button 
          onClick={registerAsSimulator}
          disabled={isRegistering}
          className="w-full bg-blue-500 hover:bg-blue-600"
        >
          {isRegistering ? 'Registering...' : 'Register as Simulator (10 ETH)'}
        </Button>
        
        {status && (
          <div className="p-3 bg-neutral-800 rounded">
            <p className="text-sm text-white">{status}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}