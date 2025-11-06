// Transaction Intent Submission Hook
"use client"

import { useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { createWalletClient, custom, parseEther, encodeFunctionData, defineChain } from 'viem'

// Define Somnia Network chain
const somnia = defineChain({
  id: 50312,
  name: 'Somnia Network',
  network: 'somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
    },
    public: {
      http: ['https://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.somnia.network' },
  },
})

// Contract addresses from your deployed contracts
const VIGILANT_ADDRESS = "0x0b1Cd4df8E32Fc97022F54D1671F5f49b8549852" as `0x${string}`
const THREAT_DB_ADDRESS = "0xab744628db53468A9F3802e8C84Fa22E779573c0" as `0x${string}`

// Vigilant Contract ABI (simplified for submitIntent)
const VIGILANT_ABI = [
  {
    name: 'submitIntent',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    name: 'checkConsensus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'intentId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'executeIntent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'intentId', type: 'bytes32' }],
    outputs: []
  }
] as const

export interface TransactionIntent {
  target: string
  calldata: string
  value: string
  description: string
}

export function useVigilantSubmission() {
  const { wallets } = useWallets()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [intentId, setIntentId] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'safe' | 'malicious'>('pending')

  const submitIntent = async (intent: TransactionIntent) => {
    if (!wallets[0]) throw new Error('Wallet not connected')
    
    setIsSubmitting(true)
    setVerificationStatus('pending')
    
    try {
      // Get the wallet provider
      const provider = await wallets[0].getEthereumProvider()
      
      // Create wallet client
      const walletClient = createWalletClient({
        chain: somnia,
        transport: custom(provider)
      })
      
      const [account] = await walletClient.getAddresses()
      
      // Submit intent with verification fee + value
      const intentValue = parseEther(intent.value)
      const verificationFee = parseEther("0.001")
      
      const hash = await walletClient.writeContract({
        address: VIGILANT_ADDRESS,
        abi: VIGILANT_ABI,
        functionName: 'submitIntent',
        args: [
          intent.target as `0x${string}`, 
          intent.calldata as `0x${string}`,
          intentValue
        ],
        value: intentValue + verificationFee, // Total payment = value + fee
        account
      })
      
      console.log('Intent submitted:', hash)
      
      setVerificationStatus('verifying')
      
      // For now, simulate verification (you'd implement actual polling here)
      setTimeout(() => {
        setVerificationStatus('safe')
        setIntentId(hash) // Using tx hash as intent ID for demo
      }, 3000)
      
      return hash
      
    } catch (error) {
      console.error('Failed to submit intent:', error)
      setVerificationStatus('pending')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const executeIntent = async () => {
    if (!wallets[0] || !intentId) throw new Error('No intent to execute')
    
    try {
      const provider = await wallets[0].getEthereumProvider()
      
      const walletClient = createWalletClient({
        chain: somnia,
        transport: custom(provider)
      })
      
      const [account] = await walletClient.getAddresses()
      
      const hash = await walletClient.writeContract({
        address: VIGILANT_ADDRESS,
        abi: VIGILANT_ABI,
        functionName: 'executeIntent',
        args: [intentId as `0x${string}`],
        account
      })
      
      console.log('Intent executed:', hash)
      return hash
    } catch (error) {
      console.error('Failed to execute intent:', error)
      throw error
    }
  }

  return {
    submitIntent,
    executeIntent,
    isSubmitting,
    intentId,
    verificationStatus,
    isVerified: verificationStatus === 'safe'
  }
}