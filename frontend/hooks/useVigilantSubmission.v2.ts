"use client"

import { useState, useEffect } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { createWalletClient, custom, parseEther, createPublicClient, http } from 'viem'
import { defineChain } from 'viem'
import { vigilantStreams } from '@/lib/vigilantStreams'

// Define Somnia Network chain
const somnia = defineChain({
  id: 50312,
  name: 'Somnia Network',
  network: 'somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
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
    default: { name: 'Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
})

// Contract addresses
const VIGILANT_ADDRESS = "0x5958E666C6D290F8325E2BC414588DC8D1E68963" as `0x${string}`

// Complete Vigilant Contract ABI with proper typing
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
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([])

  // Initialize Somnia Streams on component mount
  useEffect(() => {
    const initializeStreams = async () => {
      try {
        await vigilantStreams.initialize()
        
        // Subscribe to real-time updates
        vigilantStreams.subscribeToStatus((data) => {
          setRealTimeUpdates(prev => [...prev, { type: 'status', ...data }])
          
          // Update verification status based on stream data
          if (data.status === 1) setVerificationStatus('verifying')
          if (data.status === 2) setVerificationStatus('safe')
          if (data.status === 3) setVerificationStatus('malicious')
        })

        vigilantStreams.subscribeToSimulations((data) => {
          setRealTimeUpdates(prev => [...prev, { type: 'simulation', ...data }])
        })

        vigilantStreams.subscribeToThreats((data) => {
          setRealTimeUpdates(prev => [...prev, { type: 'threat', ...data }])
        })
        
      } catch (error) {
        console.error('Failed to initialize Vigilant Streams:', error)
      }
    }

    initializeStreams()
  }, [])

  // Broadcast intent to Somnia Streams
  const broadcastIntent = async (intent: TransactionIntent, intentId: string) => {
    try {
      console.log('📡 Broadcasting intent via Somnia Streams...')
      
      // Note: In a real implementation, you would publish data to streams here
      // For now, we're just logging since publishing requires wallet integration
      console.log('Intent broadcast data:', {
        intentId,
        target: intent.target,
        value: intent.value,
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('Stream broadcast failed:', error)
    }
  }

  const submitIntent = async (intent: TransactionIntent) => {
    if (!wallets[0]) throw new Error('Wallet not connected')
    
    setIsSubmitting(true)
    setVerificationStatus('pending')
    
    try {
      console.log('Starting intent submission...', {
        target: intent.target,
        calldata: intent.calldata,
        value: intent.value
      })

      // Get the wallet provider
      const provider = await wallets[0].getEthereumProvider()
      
      // Create wallet client
      const walletClient = createWalletClient({
        chain: somnia,
        transport: custom(provider)
      })
      
      const [account] = await walletClient.getAddresses()
      console.log('Using account:', account)
      
      // Parse values
      const intentValue = parseEther(intent.value)
      const verificationFee = parseEther("0.001")
      const totalValue = intentValue + verificationFee
      
      console.log('Values:', {
        intentValue: intentValue.toString(),
        verificationFee: verificationFee.toString(),
        totalValue: totalValue.toString()
      })

      // Submit intent with all 3 parameters explicitly
      const hash = await walletClient.writeContract({
        address: VIGILANT_ADDRESS,
        abi: VIGILANT_ABI,
        functionName: 'submitIntent',
        args: [
          intent.target as `0x${string}`, 
          intent.calldata as `0x${string}`,
          intentValue // This is the third parameter (uint256 value)
        ],
        value: totalValue, // Total ETH to send = intent value + verification fee
        account,
        gas: BigInt(500000) // Add explicit gas limit
      })
      
      console.log('Intent submitted successfully:', hash)
      
      setVerificationStatus('verifying')
      setIntentId(hash)
      
      // Broadcast intent via Somnia Streams
      try {
        await broadcastIntent(intent, hash)
      } catch (streamError) {
        console.warn('Failed to broadcast via streams:', streamError)
      }
      
      // Simulate verification process (enhanced with streams)
      setTimeout(() => {
        setVerificationStatus('safe')
      }, 3000)
      
      return hash
      
    } catch (error: any) {
      console.error('Failed to submit intent:', error)
      setVerificationStatus('pending')
      
      // Provide more detailed error information
      if (error.message) {
        throw new Error(`Submission failed: ${error.message}`)
      } else {
        throw error
      }
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
    isVerified: verificationStatus === 'safe',
    realTimeUpdates
  }
}