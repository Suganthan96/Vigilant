import { createPublicClient, createWalletClient, http, webSocket } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaTestnet } from './chain'

/**
 * Environment variable validation helper
 */
function need(key: 'RPC_URL' | 'PRIVATE_KEY'): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing ${key} in environment variables`)
  }
  return value
}

/**
 * Public client for read operations and subscriptions
 * Uses HTTP transport for standard operations
 */
export const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(need('RPC_URL')),
})

/**
 * Public client with WebSocket transport for real-time subscriptions
 * Required for SDS streaming and event subscriptions
 */
export const publicClientWS = createPublicClient({
  chain: somniaTestnet,
  transport: webSocket(need('RPC_URL').replace('https://', 'wss://').replace('http://', 'ws://')),
})

/**
 * Wallet client for write operations
 * Uses private key authentication for transaction signing
 */
export const walletClient = createWalletClient({
  account: privateKeyToAccount(need('PRIVATE_KEY') as `0x${string}`),
  chain: somniaTestnet,
  transport: http(need('RPC_URL')),
})

/**
 * Get the current wallet address
 */
export function getWalletAddress(): `0x${string}` {
  if (!walletClient.account) {
    throw new Error('Wallet client not properly initialized')
  }
  return walletClient.account.address
}