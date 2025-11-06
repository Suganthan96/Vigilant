/**
 * Register Vigilant schemas on Somnia Data Streams
 * Run this once to register all schemas needed for the MEV protection system
 */

import 'dotenv/config'
import { getVigilantStreams } from '../src/lib/realVigilantStreams'

async function main() {
  console.log('🚀 Starting Vigilant schema registration...')

  if (!process.env.RPC_URL) {
    throw new Error('Missing RPC_URL environment variable')
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error('Missing PRIVATE_KEY environment variable (needed for registration)')
  }

  const vigilantStreams = getVigilantStreams({
    rpcUrl: process.env.RPC_URL,
    wsUrl: process.env.WS_URL,
    privateKey: process.env.PRIVATE_KEY
  })

  try {
    await vigilantStreams.initialize()
    console.log('✅ All Vigilant schemas registered successfully!')
  } catch (error) {
    console.error('❌ Schema registration failed:', error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Registration script failed:', error)
  process.exit(1)
})