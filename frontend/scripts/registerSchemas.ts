import { createSomniaClients, createStreamsSDK } from '../lib/somniaClient'
import { INTENT_SCHEMA, SIMULATION_SCHEMA, INTENT_STATUS_SCHEMA } from '../lib/schemas'

async function registerSchemas() {
  console.log('🔄 Starting schema registration for Vigilant Streams...')
  
  try {
    // Create Somnia clients
    const { publicClient } = createSomniaClients()
    const streamsSDK = createStreamsSDK(publicClient)
    
    console.log('✅ Somnia Streams SDK initialized')
    
    // Compute Schema IDs (schemas are implicitly registered when used)
    console.log('📝 Computing Intent Schema ID...')
    const intentSchemaId = await streamsSDK.streams.computeSchemaId(INTENT_SCHEMA)
    console.log('✅ Intent Schema ID computed:', intentSchemaId)
    
    // Compute Simulation Schema ID
    console.log('📝 Computing Simulation Results Schema ID...')
    const simulationSchemaId = await streamsSDK.streams.computeSchemaId(SIMULATION_SCHEMA)
    console.log('✅ Simulation Schema ID computed:', simulationSchemaId)
    
    // Compute Intent Status Schema ID
    console.log('📝 Computing Intent Status Schema ID...')
    const statusSchemaId = await streamsSDK.streams.computeSchemaId(INTENT_STATUS_SCHEMA)
    console.log('✅ Status Schema ID computed:', statusSchemaId)
    
    console.log('\n🎉 All Vigilant schema IDs computed successfully!')
    console.log('Schema IDs:')
    console.log(`- Intent: ${intentSchemaId}`)
    console.log(`- Simulation: ${simulationSchemaId}`)
    console.log(`- Status: ${statusSchemaId}`)
    
    return {
      intentSchemaId,
      simulationSchemaId,
      statusSchemaId
    }
    
  } catch (error) {
    console.error('❌ Schema computation failed:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  registerSchemas()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { registerSchemas }