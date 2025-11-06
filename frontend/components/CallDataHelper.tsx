"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { encodeFunctionData, parseEther } from "viem"

interface CallDataHelperProps {
  onCallDataGenerated: (callData: string, description: string) => void
}

export function CallDataHelper({ onCallDataGenerated }: CallDataHelperProps) {
  const [selectedFunction, setSelectedFunction] = useState<string>("")
  const [recipient, setRecipient] = useState("0x742d35cc6634c0532925a3b8d4d8b30cf8d9a2c8")
  const [amount, setAmount] = useState("1")
  const [spender, setSpender] = useState("0x742d35cc6634c0532925a3b8d4d8b30cf8d9a2c8")

  // Common ERC-20 ABI functions
  const erc20Abi = [
    {
      name: 'transfer',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ name: '', type: 'bool' }]
    },
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ name: '', type: 'bool' }]
    }
  ] as const

  const functionTemplates = [
    {
      id: 'transfer',
      name: 'ERC-20 Transfer',
      description: 'Transfer tokens to an address',
      badge: 'Token',
      color: 'bg-blue-500'
    },
    {
      id: 'approve',
      name: 'ERC-20 Approval',
      description: 'Approve tokens for spending',
      badge: 'Approval',
      color: 'bg-orange-500'
    },
    {
      id: 'eth_transfer',
      name: 'ETH Transfer',
      description: 'Send native ETH',
      badge: 'Native',
      color: 'bg-green-500'
    },
    {
      id: 'custom',
      name: 'Custom Call Data',
      description: 'Enter your own call data',
      badge: 'Custom',
      color: 'bg-purple-500'
    }
  ]

  const generateCallData = () => {
    try {
      let callData = ""
      let description = ""

      switch (selectedFunction) {
        case 'transfer':
          callData = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [recipient as `0x${string}`, parseEther(amount)]
          })
          description = `Transfer ${amount} tokens to ${recipient.slice(0, 8)}...`
          break

        case 'approve':
          const approvalAmount = amount === 'unlimited' ? 
            BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') : 
            parseEther(amount)
          
          callData = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [spender as `0x${string}`, approvalAmount]
          })
          description = `Approve ${amount === 'unlimited' ? 'unlimited' : amount} tokens for ${spender.slice(0, 8)}...`
          break

        case 'eth_transfer':
          callData = "0x"
          description = `Send ${amount} ETH to ${recipient.slice(0, 8)}...`
          break

        default:
          return
      }

      onCallDataGenerated(callData, description)
    } catch (error) {
      console.error('Error generating call data:', error)
    }
  }

  const renderFunctionForm = () => {
    switch (selectedFunction) {
      case 'transfer':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-blue-400">Recipient Address</label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-blue-400">Amount (in tokens)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.0"
                className="mt-1"
              />
            </div>
          </div>
        )

      case 'approve':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-orange-400">Spender Address</label>
              <Input
                value={spender}
                onChange={(e) => setSpender(e.target.value)}
                placeholder="0x..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-orange-400">Amount</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1.0"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount('unlimited')}
                  className="whitespace-nowrap"
                >
                  Unlimited
                </Button>
              </div>
            </div>
          </div>
        )

      case 'eth_transfer':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-green-400">Recipient Address</label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-green-400">Amount (in ETH)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                className="mt-1"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-cyan-400">📝 Call Data Helper</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Function Templates */}
        <div className="grid grid-cols-2 gap-3">
          {functionTemplates.map((template) => (
            <Button
              key={template.id}
              variant={selectedFunction === template.id ? "default" : "outline"}
              className={`h-auto p-4 flex-col items-start space-y-2 ${
                selectedFunction === template.id ? template.color : ""
              }`}
              onClick={() => setSelectedFunction(template.id)}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{template.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {template.badge}
                </Badge>
              </div>
              <span className="text-xs text-slate-400 text-left">
                {template.description}
              </span>
            </Button>
          ))}
        </div>

        {/* Function Form */}
        {selectedFunction && selectedFunction !== 'custom' && (
          <div className="space-y-4">
            {renderFunctionForm()}
            
            <Button 
              onClick={generateCallData}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Generate Call Data
            </Button>
          </div>
        )}

        {/* Common Examples */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Quick Examples:</h4>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-800 rounded border">
              <div className="text-blue-400 font-medium">ERC-20 Transfer</div>
              <div className="text-slate-400 font-mono break-all">
                0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d4d8b30cf8d9a2c8000000000000000000000000000000000000000000000000000de0b6b3a7640000
              </div>
            </div>
            
            <div className="p-3 bg-slate-800 rounded border">
              <div className="text-orange-400 font-medium">ERC-20 Unlimited Approval</div>
              <div className="text-slate-400 font-mono break-all">
                0x095ea7b3000000000000000000000000742d35cc6634c0532925a3b8d4d8b30cf8d9a2c8ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
              </div>
            </div>
            
            <div className="p-3 bg-slate-800 rounded border">
              <div className="text-green-400 font-medium">ETH Transfer (empty call data)</div>
              <div className="text-slate-400 font-mono">
                0x
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}