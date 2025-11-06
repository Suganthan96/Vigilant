"use client"

import { useState } from "react"
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, DollarSign, AlertTriangle, Zap, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"

export default function CommandCenterPage() {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const [activeTab, setActiveTab] = useState("swap")
  const [verificationProgress, setVerificationProgress] = useState(0)
  
  const wallet = wallets[0]

  return (
    <div className="p-6 space-y-6">
      {/* Main Layout: Content Left, Sidebar Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* MAIN CONTENT AREA - Left Side */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Value Saved */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">Value Saved</p>
                    <p className="text-2xl font-bold text-green-400">$2.4M</p>
                    <p className="text-xs text-neutral-500">Last 30 days</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Threats Blocked */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">Threats Blocked</p>
                    <p className="text-2xl font-bold text-red-400">1,247</p>
                    <p className="text-xs text-neutral-500">This week</p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Simulators */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">Simulators</p>
                    <p className="text-2xl font-bold text-blue-400">247</p>
                    <p className="text-xs text-neutral-500">Currently active</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <div className="flex space-x-4">
                <Button
                  variant={activeTab === "swap" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("swap")}
                  className={activeTab === "swap" ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  Swap Protection
                </Button>
                <Button
                  variant={activeTab === "approve" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("approve")}
                  className={activeTab === "approve" ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  Approval Monitor
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Active Feature UI */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">
                {activeTab === "swap" ? "Swap Protection Interface" : "Token Approval Monitor"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!authenticated || !wallet ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
                  <p className="text-neutral-400 mb-4">
                    Connect your wallet to start using Vigilant's advanced MEV protection features
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                    <Shield className="w-4 h-4" />
                    <span>Protected by Vigilant Security Protocol</span>
                  </div>
                </div>
              ) : activeTab === "swap" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-800 rounded-lg">
                      <label className="block text-sm font-medium text-neutral-300 mb-2">From Token</label>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">ETH</span>
                        </div>
                        <input
                          type="number"
                          placeholder="0.0"
                          className="flex-1 bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-neutral-800 rounded-lg">
                      <label className="block text-sm font-medium text-neutral-300 mb-2">To Token</label>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">USDC</span>
                        </div>
                        <input
                          type="number"
                          placeholder="0.0"
                          className="flex-1 bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                    <span className="text-sm text-neutral-300">Protection Level</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                      Maximum
                    </Badge>
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Execute Protected Swap
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { token: "USDC", spender: "0x1234...5678", amount: "1000.00", risk: "low" },
                      { token: "DAI", spender: "0x8765...4321", amount: "Unlimited", risk: "high" },
                      { token: "WETH", spender: "0x9876...1234", amount: "50.00", risk: "medium" }
                    ].map((approval, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">{approval.token}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{approval.token}</p>
                            <p className="text-xs text-neutral-400">{approval.spender}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">{approval.amount}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              approval.risk === "high" ? "text-red-400 border-red-500/20" :
                              approval.risk === "medium" ? "text-yellow-400 border-yellow-500/20" :
                              "text-green-400 border-green-500/20"
                            }`}
                          >
                            {approval.risk} risk
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800">
                    Revoke Selected Approvals
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Progress (When Active) */}
          {verificationProgress > 0 && (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-300">Transaction Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Verifying transaction safety...</span>
                    <span className="text-white">{verificationProgress}%</span>
                  </div>
                  <Progress value={verificationProgress} className="h-2" />
                  <div className="flex items-center space-x-2 text-xs text-neutral-500">
                    <Clock className="w-4 h-4" />
                    <span>Estimated time: 15 seconds</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* SIDEBAR - Right Side */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Protection Status */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PROTECTION STATUS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400 font-medium">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Protection Level</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                    Maximum
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Fee Estimate</span>
                  <span className="text-sm text-white">0.5% avg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Threats */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">RECENT THREATS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {[
                  { time: "2 min ago", type: "Sandwich Attack", status: "blocked", severity: "high" },
                  { time: "5 min ago", type: "Front-running", status: "blocked", severity: "medium" },
                  { time: "12 min ago", type: "MEV Extraction", status: "blocked", severity: "high" },
                  { time: "18 min ago", type: "Price Manipulation", status: "blocked", severity: "low" },
                ].map((threat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-white font-medium">{threat.type}</span>
                      </div>
                      <p className="text-xs text-neutral-500">{threat.time}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        threat.severity === "high" ? "text-red-400 border-red-500/20" :
                        threat.severity === "medium" ? "text-yellow-400 border-yellow-500/20" :
                        "text-green-400 border-green-500/20"
                      }`}
                    >
                      {threat.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Metrics */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SECURITY METRICS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Detection Rate</span>
                  <span className="text-sm text-green-400 font-bold">99.8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Response Time</span>
                  <span className="text-sm text-white font-bold">&lt; 50ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Success Rate</span>
                  <span className="text-sm text-green-400 font-bold">99.9%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Status */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">NETWORK STATUS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Simulator Count</span>
                  <span className="text-sm text-white font-bold">247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Active Intents</span>
                  <span className="text-sm text-white font-bold">1,423</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Avg Verification Time</span>
                  <span className="text-sm text-white font-bold">12.3s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
