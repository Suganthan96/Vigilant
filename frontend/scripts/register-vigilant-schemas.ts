// Register Vigilant schemas on Somnia Data Streams
import 'dotenv/config'
import { SDK } from '@somnia-chain/streams'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { waitForTransactionReceipt } from 'viem/actions'
import { somniaTestnet } from '../lib/vigilantStreams'
import { schemas } from '../lib/vigilantSchemas'

function getEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing ${key} in environment variables`)
  }
  return value
}

async function registerVigilantSchemas() {
  console.log('🚀 Registering Vigilant schemas on Somnia Data Streams...')

  try {
    // Create clients
    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http('https://dream-rpc.somnia.network'),
    })

    const walletClient = createWalletClient({
      account: privateKeyToAccount(getEnvVar('PRIVATE_KEY') as `0x${string}`),
      chain: somniaTestnet,
      transport: http('https://dream-rpc.somnia.network'),
    })

    // Initialize SDK
    const sdk = new SDK({ public: publicClient, wallet: walletClient })

    // Register each schema
    for (const [name, schema] of Object.entries(schemas)) {
      console.log(`\n📊 Processing ${name} schema...`)
      console.log(`Schema: ${schema}`)

      // Compute schema ID
      const schemaId = await sdk.streams.computeSchemaId(schema)
      console.log(`Schema ID: ${schemaId}`)

      // Check if already registered (only if schemaId is valid)
      if (schemaId) {
        const isRegistered = await sdk.streams.isDataSchemaRegistered(schemaId)
        if (isRegistered) {
          console.log(`✅ Schema ${name} already registered`)
          continue
        }
      }

      // Register schema
      console.log(`📝 Registering ${name} schema...`)
      const txHash = await sdk.streams.registerDataSchemas([{ 
        id: `vigilant-${name}`,
        schema 
      }])
      console.log(`Transaction: ${txHash}`)

      // Wait for confirmation if txHash is valid
      if (txHash && typeof txHash === 'string') {
        const receipt = await waitForTransactionReceipt(publicClient, { hash: txHash as `0x${string}` })
        console.log(`✅ Registered in block: ${receipt.blockNumber}`)
      }
    }

    console.log('\n🎉 All Vigilant schemas registered successfully!')

  } catch (error) {
    console.error('❌ Schema registration failed:', error)
    process.exit(1)
  }
}

// Run the registration
registerVigilantSchemas().catch((error) => {
  console.error('❌ Registration script failed:', error)
  process.exit(1)
})