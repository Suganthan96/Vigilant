"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Eye,
  Flame,
  Server,
  Shield,
  TrendingUp,
  Zap,
  WifiOff
} from "lucide-react"

interface MempoolTransaction {
  hash: string
  type: string
  gasPrice: number
  avgGas: number
  risk: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
}

interface StateChange {
  type: string
  contract: string
  details: string
  timestamp: Date
}

interface ActiveProtection {
  intentId: string
  status: 'verifying' | 'safe' | 'blocked'
  progress: number
  riskScore: number
  timestamp: Date
}

export default function SystemsPage() {
  const [mempoolTxs, setMempoolTxs] = useState<MempoolTransaction[]>([
    {
      hash: "0xAB12...",
      type: "DEX Router",
      gasPrice: 2.5,
      avgGas: 1.0,
      risk: 'high',
      timestamp: new Date(Date.now() - 5000)
    },
    {
      hash: "0xCD34...",
      type: "Token Contract",
      gasPrice: 1.0,
      avgGas: 1.0,
      risk: 'low',
      timestamp: new Date(Date.now() - 8000)
    },
    {
      hash: "0xEF56...",
      type: "Flash Loan Protocol",
      gasPrice: 3.2,
      avgGas: 1.0,
      risk: 'critical',
      timestamp: new Date(Date.now() - 12000)
    }
  ])

  const [stateChanges, setStateChanges] = useState<StateChange[]>([
    {
      type: "Storage Update",
      contract: "0xDEX123...",
      details: "Storage slot 0x3 changed",
      timestamp: new Date(Date.now() - 2000)
    },
    {
      type: "Event Emission",
      contract: "0xPRICE456...",
      details: "PriceUpdate event emitted",
      timestamp: new Date(Date.now() - 5000)
    }
  ])

  const [activeProtections, setActiveProtections] = useState<ActiveProtection[]>([
    {
      intentId: "0xABC...",
      status: 'verifying',
      progress: 67,
      riskScore: 15,
      timestamp: new Date(Date.now() - 10000)
    },
    {
      intentId: "0xDEF...",
      status: 'safe',
      progress: 100,
      riskScore: 8,
      timestamp: new Date(Date.now() - 30000)
    }
  ])

  const [systemStats, setSystemStats] = useState({
    pendingTxs: 234,
    highGasTxs: 12,
    competingTxs: 3,
    activeMonitors: 15,
    detectionRate: 99.8,
    responseTime: 45,
    uptime: 99.99
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update stats
      setSystemStats(prev => ({
        ...prev,
        pendingTxs: prev.pendingTxs + Math.floor(Math.random() * 10) - 5,
        highGasTxs: Math.max(0, prev.highGasTxs + Math.floor(Math.random() * 3) - 1),
        competingTxs: Math.max(0, prev.competingTxs + Math.floor(Math.random() * 2) - 1)
      }))

      // Occasionally add new mempool transaction
      if (Math.random() < 0.3) {
        const newTx: MempoolTransaction = {
          hash: `0x${Math.random().toString(16).substring(2, 8).toUpperCase()}...`,
          type: ['DEX Router', 'Token Contract', 'Flash Loan Protocol', 'Arbitrage Bot'][Math.floor(Math.random() * 4)],
          gasPrice: Number((Math.random() * 3 + 0.5).toFixed(1)),
          avgGas: 1.0,
          risk: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          timestamp: new Date()
        }
        
        setMempoolTxs(prev => [newTx, ...prev.slice(0, 9)])
      }

      // Update active protections
      setActiveProtections(prev => prev.map(protection => {
        if (protection.status === 'verifying' && protection.progress < 100) {
          const newProgress = Math.min(protection.progress + Math.random() * 15, 100)
          return {
            ...protection,
            progress: newProgress,
            status: newProgress >= 100 ? 'safe' : 'verifying'
          }
        }
        return protection
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20'
      default: return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'verifying': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'blocked': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20'
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Security Monitor</h1>
          <p className="text-neutral-400">Real-time mempool and state monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
            System Online
          </Badge>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Detection Rate</p>
                <p className="text-2xl font-bold text-green-400">{systemStats.detectionRate}%</p>
              </div>
              <Shield className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Response Time</p>
                <p className="text-2xl font-bold text-blue-400">{systemStats.responseTime}ms</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Active Monitors</p>
                <p className="text-2xl font-bold text-orange-400">{systemStats.activeMonitors}</p>
              </div>
              <Eye className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Uptime</p>
                <p className="text-2xl font-bold text-white">{systemStats.uptime}%</p>
              </div>
              <Server className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Mempool Activity - Large Column */}
        <div className="xl:col-span-2">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-400" />
                Mempool Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-800 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{systemStats.pendingTxs}</p>
                  <p className="text-xs text-neutral-400">Pending Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{systemStats.highGasTxs}</p>
                  <p className="text-xs text-neutral-400">High Gas Txs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{systemStats.competingTxs}</p>
                  <p className="text-xs text-neutral-400">Competing Txs</p>
                </div>
              </div>

              {/* Live Feed */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-white">[Live Feed]</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {mempoolTxs.map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-800 rounded hover:bg-neutral-750 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-white">{tx.hash}</span>
                        <span className="text-xs text-neutral-400">→</span>
                        <span className="text-sm text-neutral-300">{tx.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-neutral-400">
                          Gas: {tx.gasPrice}x avg
                        </div>
                        <Badge variant="outline" className={`text-xs ${getRiskColor(tx.risk)}`}>
                          {tx.risk === 'critical' ? '🚨' : tx.risk === 'high' ? '⚠️' : ''}
                        </Badge>
                        <span className="text-xs text-neutral-500">{formatTimeAgo(tx.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* State Changes Detected */}
          <Card className="bg-neutral-900 border-neutral-700 mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                State Changes Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stateChanges.map((change, index) => (
                  <div key={index} className="p-3 bg-neutral-800 rounded">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">• {change.details}</span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">
                          Contract: {change.contract}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {formatTimeAgo(change.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Protections Sidebar */}
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                ACTIVE PROTECTIONS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-neutral-400 mb-4">
                  Active Protections: {activeProtections.length}
                </div>
                
                {activeProtections.map((protection, index) => (
                  <div key={index} className="p-3 bg-neutral-800 rounded space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-white">{protection.intentId}</span>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(protection.status)}`}>
                        {protection.status}
                      </Badge>
                    </div>
                    
                    {protection.status === 'verifying' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-400">Progress:</span>
                          <span className="text-white">{Math.floor(protection.progress)}%</span>
                        </div>
                        <Progress value={protection.progress} className="h-1" />
                      </div>
                    )}
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Risk:</span>
                      <span className={`${protection.riskScore < 20 ? 'text-green-400' : protection.riskScore < 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {protection.riskScore}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                SYSTEM HEALTH
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Mempool Monitor</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">State Monitor</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Risk Engine</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Simulation Grid</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-700">
                <Button variant="outline" className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800">
                  View System Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
