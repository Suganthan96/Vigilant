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

interface VerificationTask {
  id: string
  transactionHash: string
  progress: number
  riskScore: number
  maxRisk: number
  status: 'pending' | 'verifying' | 'completed' | 'failed'
  layers: {
    name: string
    status: 'completed' | 'pending' | 'running'
    risk: number
  }[]
  threatsDetected: number
  estimatedTime: number
  startTime: Date
}

export default function AgentNetworkPage() {
  const [verificationTasks, setVerificationTasks] = useState<VerificationTask[]>([
    {
      id: "VT-001",
      transactionHash: "0xABC123...",
      progress: 67,
      riskScore: 25,
      maxRisk: 100,
      status: 'verifying',
      layers: [
        { name: "Basic Simulation", status: 'completed', risk: 10 },
        { name: "Mempool Analysis", status: 'completed', risk: 30 },
        { name: "Pattern Matching", status: 'running', risk: 0 },
        { name: "Behavioral Analysis", status: 'pending', risk: 0 },
        { name: "Approval Check", status: 'pending', risk: 0 }
      ],
      threatsDetected: 0,
      estimatedTime: 2,
      startTime: new Date(Date.now() - 8000)
    },
    {
      id: "VT-002", 
      transactionHash: "0xDEF456...",
      progress: 100,
      riskScore: 8,
      maxRisk: 100,
      status: 'completed',
      layers: [
        { name: "Basic Simulation", status: 'completed', risk: 5 },
        { name: "Mempool Analysis", status: 'completed', risk: 8 },
        { name: "Pattern Matching", status: 'completed', risk: 3 },
        { name: "Behavioral Analysis", status: 'completed', risk: 2 },
        { name: "Approval Check", status: 'completed', risk: 0 }
      ],
      threatsDetected: 0,
      estimatedTime: 0,
      startTime: new Date(Date.now() - 30000)
    }
  ])

  const [simulatorStats, setSimulatorStats] = useState({
    active: 247,
    queued: 12,
    completed: 1423,
    avgTime: 4.2
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVerificationTasks(prev => prev.map(task => {
        if (task.status === 'verifying' && task.progress < 100) {
          const newProgress = Math.min(task.progress + Math.random() * 10, 100)
          const newStatus = newProgress >= 100 ? 'completed' : 'verifying'
          
          // Update layer statuses based on progress
          const updatedLayers = task.layers.map((layer, index) => {
            const layerThreshold = (index + 1) * 20
            if (newProgress >= layerThreshold) {
              return { ...layer, status: 'completed' as const }
            } else if (newProgress >= layerThreshold - 15) {
              return { ...layer, status: 'running' as const }
            }
            return layer
          })

          return {
            ...task,
            progress: newProgress,
            status: newStatus,
            layers: updatedLayers,
            estimatedTime: Math.max(0, task.estimatedTime - 0.5)
          }
        }
        return task
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'running': return 'text-orange-400' 
      case 'pending': return 'text-neutral-500'
      case 'failed': return 'text-red-400'
      default: return 'text-neutral-400'
    }
  }

  const getRiskColor = (risk: number) => {
    if (risk < 20) return 'text-green-400'
    if (risk < 50) return 'text-yellow-400'
    if (risk < 80) return 'text-orange-400'
    return 'text-red-400'
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
            {simulatorStats.active} Active Simulators
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
                <p className="text-2xl font-bold text-green-400">{simulatorStats.active}</p>
              </div>
              <Zap className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Queued Tasks</p>
                <p className="text-2xl font-bold text-yellow-400">{simulatorStats.queued}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Completed Today</p>
                <p className="text-2xl font-bold text-blue-400">{simulatorStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Avg Time</p>
                <p className="text-2xl font-bold text-white">{simulatorStats.avgTime}s</p>
              </div>
              <Activity className="w-8 h-8 text-white" />
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
              {verificationTasks.map((task) => (
                <Card key={task.id} className="bg-neutral-800 border-neutral-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'completed' ? 'bg-green-400' :
                          task.status === 'verifying' ? 'bg-orange-400 animate-pulse' :
                          task.status === 'failed' ? 'bg-red-400' : 'bg-neutral-500'
                        }`} />
                        <span className="text-sm font-mono text-white">{task.transactionHash}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          task.status === 'completed' ? 'text-green-400 border-green-500/20' :
                          task.status === 'verifying' ? 'text-orange-400 border-orange-500/20' :
                          task.status === 'failed' ? 'text-red-400 border-red-500/20' :
                          'text-neutral-400 border-neutral-500/20'
                        }`}
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Simulator Progress:</span>
                        <span className="text-white">
                          {Math.floor(task.progress * task.layers.length / 100)}/{task.layers.length} Complete
                        </span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>

                    {/* Risk Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Risk Score:</span>
                        <span className={`font-bold ${getRiskColor(task.riskScore)}`}>
                          {task.riskScore}/{task.maxRisk}
                        </span>
                      </div>
                      <Progress 
                        value={(task.riskScore / task.maxRisk) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Analysis Layers */}
                    <div className="space-y-2">
                      <span className="text-sm text-neutral-400">Analysis Layers:</span>
                      <div className="space-y-1">
                        {task.layers.map((layer, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {layer.status === 'completed' ? (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              ) : layer.status === 'running' ? (
                                <div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Clock className="w-3 h-3 text-neutral-500" />
                              )}
                              <span className={getStatusColor(layer.status)}>{layer.name}</span>
                            </div>
                            {layer.status === 'completed' && (
                              <span className={`${getRiskColor(layer.risk)}`}>
                                (Risk: {layer.risk})
                              </span>
                            )}
                            {layer.status === 'running' && (
                              <span className="text-orange-400">(Running...)</span>
                            )}
                            {layer.status === 'pending' && (
                              <span className="text-neutral-500">(Pending...)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Threats and Time */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
                      <div className="text-xs">
                        <span className="text-neutral-400">Detected Threats: </span>
                        <span className={task.threatsDetected > 0 ? 'text-red-400' : 'text-green-400'}>
                          {task.threatsDetected}
                        </span>
                      </div>
                      {task.status === 'verifying' && (
                        <div className="text-xs text-neutral-400">
                          Estimated time: {Math.max(0, task.estimatedTime)} seconds remaining
                        </div>
                      )}
                    </div>

                    {/* Live Status */}
                    {task.status === 'verifying' && (
                      <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                        <span className="text-xs text-red-400">🔴 Live: Monitoring mempool...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
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
                {[
                  { hash: "0x123...", time: "2s ago", risk: 5, status: "safe" },
                  { hash: "0x456...", time: "8s ago", risk: 12, status: "safe" },
                  { hash: "0x789...", time: "15s ago", risk: 78, status: "blocked" },
                  { hash: "0xABC...", time: "23s ago", risk: 3, status: "safe" },
                ].map((completion, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        completion.status === 'safe' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-white font-mono">{completion.hash}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={getRiskColor(completion.risk)}>{completion.risk}</span>
                      <span className="text-neutral-500">{completion.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}