"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Zap,
  Eye,
  Search,
  Filter
} from "lucide-react"

interface RealVerificationTask {
  intentId: string
  user: string
  target: string
  status: 'analyzing' | 'completed' | 'not_found'
  progress?: number
  simulatorResults: {
    simulator: string
    riskScore: number
    isRisky: boolean
    timestamp: number
  }[]
  elapsedTime?: number
  analysisTime?: number
  consensus?: {
    status: string
    avgRiskScore: number
    reason?: string
  }
}

interface SimulatorStats {
  totalSimulators: number
  activeSimulators: number
  totalAnalyzed: number
  totalThreats: number
  activeVerifications: number
  completedVerifications: number
}

export default function AgentNetworkPage() {
  const [verificationTasks, setVerificationTasks] = useState<RealVerificationTask[]>([])
  const [simulatorStats, setSimulatorStats] = useState<SimulatorStats>({
    totalSimulators: 0,
    activeSimulators: 0,
    totalAnalyzed: 0,
    totalThreats: 0,
    activeVerifications: 0,
    completedVerifications: 0
  })
  const [recentCompletions, setRecentCompletions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real API base URL
  const API_BASE = 'http://localhost:3003/api/simulator'

  // Fetch real data from API
  const fetchRealData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch simulator status and metrics
      const statusResponse = await fetch(`${API_BASE}/status`)
      if (!statusResponse.ok) throw new Error('Failed to fetch status')
      const statusData = await statusResponse.json()
      
      setSimulatorStats(statusData.metrics)

      // Fetch active verifications
      const activeResponse = await fetch(`${API_BASE}/active`)
      if (!activeResponse.ok) throw new Error('Failed to fetch active verifications')
      const activeData = await activeResponse.json()
      
      setVerificationTasks(activeData.active || [])

      // Fetch recent completions
      const recentResponse = await fetch(`${API_BASE}/recent`)
      if (!recentResponse.ok) throw new Error('Failed to fetch recent completions')
      const recentData = await recentResponse.json()
      
      setRecentCompletions(recentData.recent || [])

    } catch (err) {
      console.error('Error fetching real data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchRealData()
  }, [])

  // Real-time updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealData()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // WebSocket connection for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null
    
    try {
      ws = new WebSocket('ws://localhost:3003')
      
      ws.onopen = () => {
        console.log('🔗 Connected to real-time verification updates')
      }
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          switch (message.type) {
            case 'intentSubmitted':
              console.log('📨 New intent submitted:', message.data)
              fetchRealData() // Refresh data
              break
              
            case 'simulationProgress':
              console.log('📊 Simulation progress:', message.data)
              fetchRealData() // Refresh data
              break
              
            case 'consensusReached':
              console.log('🎯 Consensus reached:', message.data)
              fetchRealData() // Refresh data
              break
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      ws.onclose = () => {
        console.log('🔌 WebSocket connection closed')
      }
      
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err)
    }

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'analyzing': return 'text-orange-400' 
      case 'approved': return 'text-green-400'
      case 'blocked': return 'text-red-400'
      default: return 'text-neutral-400'
    }
  }

  const getRiskColor = (risk: number) => {
    if (risk < 20) return 'text-green-400'
    if (risk < 50) return 'text-yellow-400'
    if (risk < 80) return 'text-orange-400'
    return 'text-red-400'
  }

  const formatAddress = (address: string) => {
    if (!address) return 'N/A'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatIntentId = (intentId: string) => {
    if (!intentId) return 'N/A'
    return `${intentId.slice(0, 8)}...`
  }

  if (loading && verificationTasks.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-400">Loading real verification data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to connect to simulator API</p>
            <p className="text-neutral-500 text-sm mb-4">{error}</p>
            <Button onClick={fetchRealData} variant="outline" size="sm">
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Network</h1>
          <p className="text-neutral-400">Transaction verification and simulator management</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            {simulatorStats.activeSimulators} Active Simulators
          </Badge>
        </div>
      </div>

      {/* Simulator Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Active Simulators</p>
                <p className="text-2xl font-bold text-green-400">{simulatorStats.activeSimulators}</p>
              </div>
              <Zap className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Active Intents</p>
                <p className="text-2xl font-bold text-yellow-400">{simulatorStats.activeVerifications}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Total Analyzed</p>
                <p className="text-2xl font-bold text-blue-400">{simulatorStats.totalAnalyzed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Threats Detected</p>
                <p className="text-2xl font-bold text-red-400">{simulatorStats.totalThreats}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Active Verification Tasks */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                Transaction Verification Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {verificationTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">No active verifications</p>
                  <p className="text-neutral-500 text-sm">Submit an intent from Command Center to see real-time verification</p>
                </div>
              ) : (
                verificationTasks.map((task) => {
                  const avgRiskScore = task.simulatorResults.length > 0 
                    ? Math.round(task.simulatorResults.reduce((sum, r) => sum + r.riskScore, 0) / task.simulatorResults.length)
                    : 0
                  
                  return (
                    <Card key={task.intentId} className="bg-neutral-800 border-neutral-600">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              task.status === 'completed' ? 'bg-green-400' :
                              task.status === 'analyzing' ? 'bg-orange-400 animate-pulse' :
                              'bg-neutral-500'
                            }`} />
                            <span className="text-sm font-mono text-white">{formatIntentId(task.intentId)}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(task.status)} border-current/20`}
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* User and Target Info */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-neutral-400">User: </span>
                            <span className="text-white font-mono">{formatAddress(task.user)}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Target: </span>
                            <span className="text-white font-mono">{formatAddress(task.target)}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Simulator Progress:</span>
                            <span className="text-white">
                              {task.simulatorResults.length}/2 Complete
                            </span>
                          </div>
                          <Progress value={task.progress || 0} className="h-2" />
                        </div>

                        {/* Risk Score */}
                        {avgRiskScore > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-400">Average Risk Score:</span>
                              <span className={`font-bold ${getRiskColor(avgRiskScore)}`}>
                                {avgRiskScore}/100
                              </span>
                            </div>
                            <Progress 
                              value={avgRiskScore} 
                              className="h-2"
                            />
                          </div>
                        )}

                        {/* Simulator Results */}
                        {task.simulatorResults.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm text-neutral-400">Simulator Results:</span>
                            <div className="space-y-1">
                              {task.simulatorResults.map((result, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                    <span className="text-white font-mono">{formatAddress(result.simulator)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`${getRiskColor(result.riskScore)}`}>
                                      Risk: {result.riskScore}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${result.isRisky ? 'text-red-400 border-red-500/20' : 'text-green-400 border-green-500/20'}`}
                                    >
                                      {result.isRisky ? 'RISKY' : 'SAFE'}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Consensus Result */}
                        {task.consensus && (
                          <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
                            <div className="text-xs">
                              <span className="text-neutral-400">Final Result: </span>
                              <span className={task.consensus.status === 'approved' ? 'text-green-400' : 'text-red-400'}>
                                {task.consensus.status.toUpperCase()}
                              </span>
                            </div>
                            {task.analysisTime && (
                              <div className="text-xs text-neutral-400">
                                Analysis time: {Math.round(task.analysisTime / 1000)}s
                              </div>
                            )}
                          </div>
                        )}

                        {/* Live Status */}
                        {task.status === 'analyzing' && (
                          <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                            <span className="text-xs text-orange-400">🔴 Live: Real SST Analysis in Progress...</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Simulator Management Sidebar */}
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                SIMULATOR MANAGEMENT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                Deploy New Simulator
              </Button>
              <Button variant="outline" className="w-full border-neutral-600">
                Scale Simulator Pool
              </Button>
              <Button variant="outline" className="w-full border-neutral-600">
                View Performance Metrics
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                RECENT COMPLETIONS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentCompletions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-neutral-500 text-xs">No recent completions</p>
                  </div>
                ) : (
                  recentCompletions.map((completion, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          completion.status === 'approved' ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <span className="text-white font-mono">{formatIntentId(completion.intentId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={getRiskColor(completion.riskScore)}>{completion.riskScore}</span>
                        <span className="text-neutral-500">
                          {Math.round((Date.now() - completion.timestamp) / 1000)}s ago
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}