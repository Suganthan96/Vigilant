"use client"

import { useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { createPublicClient, http } from 'viem'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Somnia chain definition
const somnia = {
  id: 50312,
  name: 'Somnia Network',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
}

const VIGILANT_ADDRESS = "0x5958E666C6D290F8325E2BC414588DC8D1E68963" as `0x${string}`

// Contract ABI for reading
const READ_ABI = [
  {
    name: 'activeSimulators',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'checkConsensus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'intentId', type: 'bytes32' }],
    outputs: [
      { name: 'hasConsensus', type: 'bool' },
      { name: 'isSafe', type: 'bool' },
      { name: 'avgRiskScore', type: 'uint256' }
    ]
  },
  {
    name: 'getIntent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'intentId', type: 'bytes32' }],
    outputs: [
      { name: 'user', type: 'address' },
      { name: 'target', type: 'address' },
      { name: 'callData', type: 'bytes' },
      { name: 'value', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'verified', type: 'bool' },
      { name: 'executed', type: 'bool' },
      { name: 'stateSnapshot', type: 'bytes32' }
    ]
  }
] as const

export default function ContractDebugger() {
  const [intentId, setIntentId] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const publicClient = createPublicClient({
    chain: somnia,
    transport: http('https://dream-rpc.somnia.network')
  })

  const checkContractStatus = async () => {
    setLoading(true)
    try {
      // Check active simulators
      const activeSimulators = await publicClient.readContract({
        address: VIGILANT_ADDRESS,
        abi: READ_ABI,
        functionName: 'activeSimulators'
      })

      setDebugInfo((prev: any) => ({
        ...prev,
        activeSimulators: activeSimulators.toString()
      }))

      console.log('Active simulators:', activeSimulators.toString())
    } catch (error) {
      console.error('Failed to check contract:', error)
      setDebugInfo({ error: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const checkIntentStatus = async () => {
    if (!intentId) return
    
    setLoading(true)
    try {
      // Get intent details
      const intent = await publicClient.readContract({
        address: VIGILANT_ADDRESS,
        abi: READ_ABI,
        functionName: 'getIntent',
        args: [intentId as `0x${string}`]
      })

      // Check consensus
      const consensus = await publicClient.readContract({
        address: VIGILANT_ADDRESS,
        abi: READ_ABI,
        functionName: 'checkConsensus',
        args: [intentId as `0x${string}`]
      })

      setDebugInfo({
        intent: {
          user: intent[0],
          target: intent[1],
          value: intent[3].toString(),
          executed: intent[7],
          deadline: new Date(Number(intent[5]) * 1000).toLocaleString()
        },
        consensus: {
          hasConsensus: consensus[0],
          isSafe: consensus[1],
          riskScore: consensus[2].toString()
        }
      })
    } catch (error) {
      console.error('Failed to check intent:', error)
      setDebugInfo({ error: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white">Contract Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button onClick={checkContractStatus} disabled={loading}>
            Check Contract Status
          </Button>
        </div>
        
        <div className="space-y-2">
          <input
            placeholder="Intent ID (0x...)"
            value={intentId}
            onChange={(e) => setIntentId(e.target.value)}
            className="w-full p-2 bg-neutral-800 border border-neutral-600 rounded text-white"
          />
          <Button onClick={checkIntentStatus} disabled={loading || !intentId}>
            Check Intent Status
          </Button>
        </div>

        {debugInfo && (
          <div className="p-4 bg-neutral-800 rounded">
            <pre className="text-xs text-white overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}