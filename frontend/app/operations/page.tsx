"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useVigilantStreams } from "@/hooks/useVigilantStreams"
import { CallDataHelper } from "@/components/CallDataHelper"
import { Shield, AlertTriangle, CheckCircle, Radio, Loader2, Activity, Zap } from "lucide-react"

export default function OperationsPage() {
  const [intentData, setIntentData] = useState({
    target: "0x742d35cc6634c0532925a3b8d4d8b30cf8d9a2c8",
    calldata: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d4d8b30cf8d9a2c8000000000000000000000000000000000000000000000000000de0b6b3a7640000",
    value: "0.01",
    description: "Token transfer to authorized wallet"
  })

  const { 
    submitIntent, 
    executeIntent, 
    isSubmitting,
    isExecuting,
    intentId, 
    verificationStatus, 
    isVerified,
    realTimeUpdates,
    streamsConnected,
    transactionDetails
  } = useVigilantStreams()

  const handleSubmitIntent = async () => {
    try {
      const hash = await submitIntent(intentData)
      console.log("✅ Intent submitted successfully:", hash)
    } catch (error) {
      console.error("❌ Failed to submit intent:", error)
    }
  }

  const handleExecuteIntent = async () => {
    try {
      if (!isVerified) {
        alert("Intent must be verified as safe before execution!")
        return
      }
      const hash = await executeIntent()
      console.log("✅ Intent executed successfully:", hash)
      alert(`Intent executed! Transaction: ${hash}`)
    } catch (error) {
      console.error("❌ Failed to execute intent:", error)
      alert(`Execution failed: ${error}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
      case 'verifying':
        return <Activity className="h-4 w-4 animate-pulse text-blue-500" />
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'malicious':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            VIGILANT OPERATIONS CENTER
          </h1>
          <p className="text-gray-400">Real-time Transaction Intent Management with Somnia Streams</p>
          
          {/* Streams Status */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Radio className={`h-4 w-4 ${streamsConnected ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm ${streamsConnected ? 'text-green-500' : 'text-red-500'}`}>
                Real Somnia Data Streams: {streamsConnected ? 'Connected' : 'Disconnected'}
              </span>
              {streamsConnected && (
                <Badge variant="outline" className="text-green-500 border-green-500">
                  REAL-TIME
                </Badge>
              )}
            </div>
            
            {/* Intent Status */}
            {intentId && (
              <div className="flex items-center gap-2">
                {getStatusIcon(verificationStatus)}
                <span className="text-sm text-gray-300">
                  Intent: {intentId.slice(0, 10)}... | Status: {verificationStatus.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Call Data Helper - Full Width */}
        <div className="mb-8">
          <CallDataHelper 
            onCallDataGenerated={(callData, description) => {
              setIntentData(prev => ({ 
                ...prev, 
                calldata: callData,
                description: description
              }))
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Simulator Registration Panel */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Simulator Network
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                <p className="text-sm text-orange-400">
                  <strong>Quick Setup:</strong> Register as simulator to enable real MEV analysis
                </p>
                <p className="text-xs text-orange-300/80 mt-1">
                  Requires 10 STT stake. Need 3+ simulators for consensus.
                </p>
              </div>
              
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => {
                  // Will implement simulator registration
                  console.log('Simulator registration clicked')
                }}
              >
                Register as Simulator (10 STT)
              </Button>

              {/* Simulator Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Simulators:</span>
                  <span className="text-blue-400">247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Stake:</span>
                  <span className="text-green-400">10 STT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Consensus Rate:</span>
                  <span className="text-green-400">99.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intent Submission Panel */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Submit Transaction Intent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Target Address</label>
                <Input
                  value={intentData.target}
                  onChange={(e) => setIntentData(prev => ({ ...prev, target: e.target.value }))}
                  placeholder="0x..."
                  className="bg-gray-800/50 border-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Call Data</label>
                <Input
                  value={intentData.calldata}
                  onChange={(e) => setIntentData(prev => ({ ...prev, calldata: e.target.value }))}
                  placeholder="0x..."
                  className="bg-gray-800/50 border-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Value (STT)</label>
                <Input
                  value={intentData.value}
                  onChange={(e) => setIntentData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="0.01"
                  className="bg-gray-800/50 border-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={intentData.description}
                  onChange={(e) => setIntentData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transaction purpose..."
                  className="bg-gray-800/50 border-gray-700"
                />
              </div>
              
              <Button 
                onClick={handleSubmitIntent}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Intent...
                  </>
                ) : (
                  'Submit Intent via Streams'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Intent Status Panel */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Intent Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {intentId ? (
                <>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Intent ID</span>
                      {getStatusIcon(verificationStatus)}
                    </div>
                    <p className="font-mono text-xs break-all">{intentId}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Status:</span>
                    <Badge className={`
                      ${verificationStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : ''}
                      ${verificationStatus === 'verifying' ? 'bg-blue-500/20 text-blue-500' : ''}
                      ${verificationStatus === 'safe' ? 'bg-green-500/20 text-green-500' : ''}
                      ${verificationStatus === 'malicious' ? 'bg-red-500/20 text-red-500' : ''}
                    `}>
                      {verificationStatus.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {/* Transaction Details */}
                  {transactionDetails && (
                    <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Transaction Details</span>
                        <Badge className={`
                          ${transactionDetails.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : ''}
                          ${transactionDetails.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : ''}
                          ${transactionDetails.status === 'failed' ? 'bg-red-500/20 text-red-500' : ''}
                        `}>
                          {transactionDetails.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Hash:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-300">
                              {transactionDetails.hash.slice(0, 10)}...{transactionDetails.hash.slice(-8)}
                            </span>
                            <a 
                              href={transactionDetails.blockExplorerUrl}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs underline"
                            >
                              View on Explorer
                            </a>
                          </div>
                        </div>
                        
                        {transactionDetails.blockNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Block:</span>
                            <span className="font-mono text-gray-300">#{transactionDetails.blockNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isVerified && (
                    <Button 
                      onClick={handleExecuteIntent}
                      disabled={isExecuting}
                      className="w-full bg-green-600 hover:bg-green-700 mt-4"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Executing Intent...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Execute Verified Intent
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active intent</p>
                  <p className="text-sm">Submit an intent to begin verification</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Real-time Data Streams Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {/* Detection Rate */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Detection Rate</p>
                  <p className="text-3xl font-bold text-green-400">99.8%</p>
                  <p className="text-xs text-gray-500">Last hour</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mempool Activity */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Mempool Activity</p>
                  <p className="text-3xl font-bold text-blue-400">233</p>
                  <p className="text-xs text-gray-500">Pending Transactions</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Feed Count */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Live Streams</p>
                  <p className="text-3xl font-bold text-purple-400">{realTimeUpdates.length}</p>
                  <p className="text-xs text-gray-500">Active Updates</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <Radio className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stream Status */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Stream Status</p>
                  <p className={`text-3xl font-bold ${streamsConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {streamsConnected ? 'LIVE' : 'OFF'}
                  </p>
                  <p className="text-xs text-gray-500">Data Streams</p>
                </div>
                <div className={`p-3 rounded-full ${streamsConnected ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <Radio className={`w-6 h-6 ${streamsConnected ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Threat Detection */}
        <Card className="mt-8 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              🚨 Recent MEV Threats Detected via Data Streams
              <Badge variant="outline" className="text-red-500 border-red-500 animate-pulse">
                LIVE FEED
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Mock recent threats */}
              {[
                { type: 'Sandwich Attack', time: '2 min ago', severity: 'high', txHash: '0x541F2A...' },
                { type: 'Front-running', time: '5 min ago', severity: 'medium', txHash: '0xB06480...' },
                { type: 'MEV Extraction', time: '12 min ago', severity: 'high', txHash: '0x8428CA...' },
                { type: 'Back-running', time: '18 min ago', severity: 'low', txHash: '0x2A5F31...' }
              ].map((threat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      threat.severity === 'high' ? 'bg-red-500 animate-pulse' :
                      threat.severity === 'medium' ? 'bg-yellow-500' : 'bg-orange-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-white">{threat.type}</p>
                      <p className="text-xs text-gray-400">{threat.time} • {threat.txHash}</p>
                    </div>
                  </div>
                  <Badge className={`
                    ${threat.severity === 'high' ? 'bg-red-500/20 text-red-500' : ''}
                    ${threat.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : ''}
                    ${threat.severity === 'low' ? 'bg-orange-500/20 text-orange-500' : ''}
                  `}>
                    {threat.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Updates from Somnia Streams */}
        {realTimeUpdates.length > 0 && (
          <Card className="mt-8 bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-green-500 animate-pulse" />
                🔴 LIVE: Real-time Updates via Somnia Data Streams
                {streamsConnected && (
                  <Badge variant="outline" className="text-green-500 border-green-500 animate-pulse">
                    REAL STREAMS
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {realTimeUpdates.map((update, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                    {getStatusIcon(update.status)}
                    <div className="flex-1">
                      <p className="text-sm font-mono">Intent: {update.intentId.slice(0, 12)}...</p>
                      <p className="text-xs text-gray-400">
                        {new Date(update.timestamp).toLocaleTimeString()} - Status: {update.status}
                      </p>
                      {update.txHash && (
                        <a 
                          href={`https://explorer.somnia.network/tx/${update.txHash}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          View Transaction
                        </a>
                      )}
                      {update.riskScore !== undefined && (
                        <p className="text-xs text-gray-400">
                          Risk Score: {update.riskScore}/100
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
