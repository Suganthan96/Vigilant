import 'dotenv/config'
import { SDK, zeroBytes32 } from '@somnia-chain/streams'
import { publicClient, walletClient } from '../src/lib/clients'
import { SCHEMAS } from '../src/lib/schemas'
import { waitForTransactionReceipt } from 'viem/actions'

/**
 * Register all Vigilant schemas on Somnia Data Streams
 * This makes schemas discoverable and reusable by other applications
 */
async function main() {
  console.log('📝 Registering Vigilant Security Protocol Schemas...\n')
  
  const sdk = new SDK({ public: publicClient, wallet: walletClient })
  
  for (const [name, schemaConfig] of Object.entries(SCHEMAS)) {
    try {
      console.log(`🔄 Processing ${name} Schema...`)
      
      // Compute schema ID
      const schemaId = await sdk.streams.computeSchemaId(schemaConfig.schema)
      
      // Check if already registered
      const isRegistered = await sdk.streams.isDataSchemaRegistered(schemaId)
      
      if (isRegistered) {
        console.log(`✅ ${name} schema already registered (ID: ${schemaId})`)
        continue
      }
      
      // Register the schema
      console.log(`📤 Registering ${name} schema...`)
      const txHash = await sdk.streams.registerDataSchemas([{
        id: schemaConfig.id,
        schema: schemaConfig.schema,
        parentSchemaId: zeroBytes32 // Root schema
      }], true) // Ignore if already registered
      
      if (!txHash) {
        console.log(`⚠️  ${name} schema registration returned null (likely already registered)`)
        continue
      }
      
      console.log(`📋 Transaction hash: ${txHash}`)
      
      // Wait for confirmation
      const receipt = await waitForTransactionReceipt(publicClient, { hash: txHash })
      console.log(`✅ ${name} schema registered in block: ${receipt.blockNumber}`)
      console.log(`   Schema ID: ${schemaId}`)
      console.log('')
      
    } catch (error) {
      console.error(`❌ Error registering ${name} schema:`, error)
    }
  }
  
  console.log('🎉 Schema registration complete!')
}

main().catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})