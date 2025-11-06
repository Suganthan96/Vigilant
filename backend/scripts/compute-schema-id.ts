import 'dotenv/config'
import { SDK } from '@somnia-chain/streams'
import { publicClient } from '../src/lib/clients'
import { SCHEMAS } from '../src/lib/schemas'

/**
 * Compute schema IDs for all Vigilant schemas
 * This script calculates the deterministic schema IDs without registering them
 */
async function main() {
  console.log('🔍 Computing Vigilant Security Protocol Schema IDs...\n')
  
  const sdk = new SDK({ public: publicClient })
  
  for (const [name, schemaConfig] of Object.entries(SCHEMAS)) {
    try {
      const schemaId = await sdk.streams.computeSchemaId(schemaConfig.schema)
      console.log(`📋 ${name} Schema:`)
      console.log(`   ID: ${schemaConfig.id}`)
      console.log(`   Schema: ${schemaConfig.schema}`)
      console.log(`   Computed ID: ${schemaId}`)
      console.log('')
    } catch (error) {
      console.error(`❌ Error computing ${name} schema ID:`, error)
    }
  }
}

main().catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})