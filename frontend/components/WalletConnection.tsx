'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Copy, ExternalLink, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

export default function WalletConnection() {
  const { login, logout, authenticated, user, ready } = usePrivy()
  const { wallets } = useWallets()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wallet = wallets[0] // Get the first connected wallet

  useEffect(() => {
    // Clear any previous errors when authentication state changes
    if (authenticated) {
      setError(null)
    }
  }, [authenticated])

  const handleLogin = async () => {
    try {
      setError(null)
      await login()
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to connect wallet. Please try again.')
    }
  }

  const handleCopyAddress = async () => {
    try {
      if (wallet?.address) {
        await navigator.clipboard.writeText(wallet.address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Copy error:', err)
      setError('Failed to copy address')
      setTimeout(() => setError(null), 3000)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-neutral-400 text-xs">
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-neutral-600 border-t-orange-500"></div>
        Loading...
      </Button>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setError(null)}
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          Error
        </Button>
      </div>
    )
  }

  if (!authenticated || !wallet) {
    return (
      <Button 
        onClick={handleLogin}
        variant="ghost" 
        size="sm" 
        className="text-neutral-400 hover:text-orange-500 text-xs flex items-center gap-2 border border-neutral-600 hover:border-orange-500/50"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Wallet Info */}
      <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 rounded-lg border border-neutral-600">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-white font-mono">
          {formatAddress(wallet.address)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyAddress}
          className="p-1 h-auto hover:bg-neutral-700"
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>

      {/* Network Badge */}
      <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/20">
        Somnia
      </Badge>

      {/* Disconnect Button */}
      <Button
        onClick={logout}
        variant="ghost"
        size="sm"
        className="p-1 text-neutral-400 hover:text-red-400"
      >
        <LogOut className="w-4 h-4" />
      </Button>

      {/* Copy Success Feedback */}
      {copied && (
        <div className="absolute top-16 right-6 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg">
          Address copied!
        </div>
      )}
    </div>
  )
}