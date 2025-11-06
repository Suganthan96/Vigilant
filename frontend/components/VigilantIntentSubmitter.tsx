"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Shield, AlertTriangle, CheckCircle, Clock, Zap, ExternalLink } from "lucide-react"
import { useVigilantStreams } from '@/hooks/useVigilantStreams'

export default function VigilantIntentSubmitter() {
  const [fromAmount, setFromAmount] = useState('')
  const [targetAddress, setTargetAddress] = useState('')
  
  const { 
    submitIntent, 
    executeIntent, 
    isSubmitting,
    isExecuting,
    intentId, 
    verificationStatus, 
    isVerified,
    transactionDetails
  } = useVigilantStreams()

  const handleSubmitIntent = async () => {
    if (!fromAmount || !targetAddress) {
      alert('Please fill in all fields')
      return
    }

    // Validate address format
    if (!targetAddress.startsWith('0x') || targetAddress.length !== 42) {
      alert('Please enter a valid Ethereum address (0x...)')
      return
    }

    // Validate amount
    const amount = parseFloat(fromAmount)
    if (amount <= 0 || amount > 10) {
      alert('Please enter a valid amount between 0 and 10 STT')
      return
    }

    try {
      console.log('Submitting intent via Streams with:', {
        fromAmount,
        targetAddress,
        totalRequired: amount + 0.001
      })

      // Create intent for STT transfer (empty calldata)
      const intent = {
        target: targetAddress,
        calldata: '0x', // Empty calldata for simple STT transfer
        value: fromAmount,
        description: `Transfer ${fromAmount} STT to ${targetAddress}`
      }

      const result = await submitIntent(intent)
      console.log('Intent submitted successfully via Streams:', result)
      
    } catch (error: any) {
      console.error('Streams submission failed:', error)
      alert('Failed to submit intent: ' + error.message)
    }
  }

  const handleExecuteIntent = async () => {
    try {
      await executeIntent()
      alert('Intent executed successfully!')
    } catch (error) {
      console.error('Execution failed:', error)
      alert('Failed to execute intent: ' + (error as Error).message)
    }
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'pending':
        return <Clock className="w-5 h-5 text-neutral-400" />
      case 'verifying':
        return <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
      case 'safe':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'malicious':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />
    }
  }

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'pending':
        return 'Ready to submit'
      case 'verifying':
        return 'Verifying via Somnia Streams...'
      case 'safe':
        return 'Transaction verified safe!'
      case 'malicious':
        return 'Potential threat detected!'
      default:
        return 'Ready to submit'
    }
  }

  const getProgressValue = () => {
    switch (verificationStatus) {
      case 'pending':
        return 0
      case 'verifying':
        return 50
      case 'safe':
        return 100
      case 'malicious':
        return 100
      default:
        return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Transaction Intent Form */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            Submit Transaction Intent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From Amount */}
          <div className="p-4 bg-neutral-800 rounded-lg">
            <label className="block text-sm font-medium text-neutral-300 mb-2">From Amount (STT)</label>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">STT</span>
              </div>
              <Input
                type="number"
                placeholder="0.001"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 bg-neutral-700 border-neutral-600 text-white"
              />
            </div>
          </div>

          {/* Target Address */}
          <div className="p-4 bg-neutral-800 rounded-lg">
            <label className="block text-sm font-medium text-neutral-300 mb-2">Target Address</label>
            <Input
              placeholder="0x... (recipient address)"
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>

          {/* Verification Fee Notice */}
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-orange-400">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Total Required: {fromAmount ? (parseFloat(fromAmount) + 0.001).toFixed(4) : '0.001'} STT</span>
            </div>
            <p className="text-xs text-orange-300/80 mt-1">
              Transfer Amount: {fromAmount || '0'} STT + Verification Fee: 0.001 STT
            </p>
          </div>

          {/* Protection Level */}
          <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
            <span className="text-sm text-neutral-300">Protection Level</span>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
              Maximum Security
            </Badge>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmitIntent}
            disabled={isSubmitting || !fromAmount || !targetAddress}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            {isSubmitting ? 'Submitting Intent via Streams...' : 'Submit Intent via Streams'}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      {transactionDetails && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-neutral-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-300">Hash:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-white">
                    {transactionDetails.hash.slice(0, 8)}...{transactionDetails.hash.slice(-6)}
                  </span>
                  <a 
                    href={transactionDetails.blockExplorerUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              {transactionDetails.blockNumber && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-neutral-300">Block:</span>
                  <span className="text-sm text-white">#{transactionDetails.blockNumber}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-neutral-300">Status:</span>
                <Badge 
                  variant="outline"
                  className={`text-xs ${
                    transactionDetails.status === 'confirmed' 
                      ? 'text-green-400 border-green-500/20' 
                      : transactionDetails.status === 'pending'
                      ? 'text-yellow-400 border-yellow-500/20'
                      : 'text-red-400 border-red-500/20'
                  }`}
                >
                  {transactionDetails.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Status */}
      {intentId && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              {getStatusIcon()}
              Intent Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Intent ID */}
            <div className="p-3 bg-neutral-800 rounded-lg">
              <p className="text-xs text-neutral-400 mb-1">Intent ID</p>
              <p className="text-sm font-mono text-white break-all">{intentId}</p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-300">{getStatusText()}</span>
                <span className="text-xs text-neutral-400">{getProgressValue()}%</span>
              </div>
              <Progress 
                value={getProgressValue()} 
                className="h-2"
              />
            </div>

            {/* Real-time Streams Analysis */}
            {verificationStatus === 'verifying' && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Zap className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">Somnia Data Streams Analysis</span>
                </div>
                <div className="space-y-1 text-xs text-blue-300/80">
                  <p>• Real-time mempool monitoring...</p>
                  <p>• Multi-layer simulation in progress...</p>
                  <p>• Checking threat patterns...</p>
                  <p>• Consensus verification...</p>
                </div>
              </div>
            )}

            {/* Execute Button */}
            {isVerified && (
              <Button 
                onClick={handleExecuteIntent}
                disabled={isExecuting}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {isExecuting ? 'Executing...' : 'Execute Verified Intent'}
              </Button>
            )}

            {/* Threat Detection */}
            {verificationStatus === 'malicious' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Threat Detected!</span>
                </div>
                <p className="text-xs text-red-300/80">
                  This transaction has been flagged as potentially malicious by our real-time analysis. Do not proceed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}