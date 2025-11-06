// Vigilant Somnia Streams Integration
import { SDK } from '@somnia-chain/streams'
import { createPublicClient, createWalletClient, http } from 'viem'
import { defineChain } from 'viem'
import { schemas, type SchemaType } from './vigilantSchemas'

// Somnia Testnet configuration
export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Network',
  network: 'somnia-testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
    public: { http: ['https://dream-rpc.somnia.network'] },
  },
})

// Create clients for Somnia Streams
export const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http('https://dream-rpc.somnia.network'),
})

// Event IDs for Vigilant Event Streams
export const VIGILANT_EVENT_IDS = {
  INTENT_SUBMITTED: 'vigilant-intent-submitted',
  SIMULATION_RESULT: 'vigilant-simulation-result', 
  THREAT_ALERT: 'vigilant-threat-alert',
  STATUS_UPDATE: 'vigilant-status-update'
} as const

// Vigilant Streams SDK wrapper
export class VigilantStreams {
  private sdk: SDK
  private dataSchemaIds: Map<SchemaType, string> = new Map()
  private eventSchemasRegistered: Set<string> = new Set()

  constructor() {
    this.sdk = new SDK({ public: publicClient })
  }

  // Initialize data schemas and event schemas
  async initialize() {
    console.log('🚀 Initializing Vigilant Data & Event Streams...')
    
    // Register data schemas first
    await this.initializeDataSchemas()
    
    // Register event schemas for reactivity
    await this.initializeEventSchemas()
  }

  // Initialize data schemas for state storage
  private async initializeDataSchemas() {
    console.log('📊 Initializing Data Schemas...')
    
    for (const [name, schema] of Object.entries(schemas)) {
      try {
        const schemaId = await this.sdk.streams.computeSchemaId(schema)
        if (schemaId) {
          this.dataSchemaIds.set(name as SchemaType, schemaId)
          console.log(`📊 Data Schema ${name}: ${schemaId}`)
        }
      } catch (error) {
        console.error(`❌ Failed to compute data schema ID for ${name}:`, error)
      }
    }
  }

  // Initialize event schemas for reactivity
  private async initializeEventSchemas() {
    console.log('📡 Initializing Event Schemas...')
    
    const eventSchemas = [
      {
        id: VIGILANT_EVENT_IDS.INTENT_SUBMITTED,
        params: ['bytes32 indexed intentId', 'address indexed user', 'address target', 'uint256 timestamp'],
        eventTopic: 'IntentSubmitted(bytes32,address,address,uint256)'
      },
      {
        id: VIGILANT_EVENT_IDS.SIMULATION_RESULT,
        params: ['bytes32 indexed intentId', 'address indexed simulator', 'bool isRisky', 'uint256 riskScore'],
        eventTopic: 'SimulationResult(bytes32,address,bool,uint256)'
      },
      {
        id: VIGILANT_EVENT_IDS.THREAT_ALERT,
        params: ['bytes32 indexed intentId', 'address indexed threatTarget', 'uint256 threatLevel'],
        eventTopic: 'ThreatAlert(bytes32,address,uint256)'
      },
      {
        id: VIGILANT_EVENT_IDS.STATUS_UPDATE,
        params: ['bytes32 indexed intentId', 'uint8 status', 'uint256 timestamp'],
        eventTopic: 'StatusUpdate(bytes32,uint8,uint256)'
      }
    ]

    try {
      const eventIds = eventSchemas.map(schema => schema.id)
      const eventParams = eventSchemas.map(schema => ({
        params: schema.params,
        eventTopic: schema.eventTopic
      }))

      const txHash = await this.sdk.streams.registerEventSchemas(eventIds, eventParams)
      console.log('📡 Event schemas registration tx:', txHash)
      
      eventIds.forEach(id => this.eventSchemasRegistered.add(id))
      
    } catch (error) {
      console.error('❌ Failed to register event schemas:', error)
    }
  }

  // Get data schema ID for a given type
  getDataSchemaId(type: SchemaType): string | undefined {
    return this.dataSchemaIds.get(type)
  }

  // Subscribe to intent submissions using Event Streams
  async subscribeToIntents(callback: (data: any) => void) {
    console.log('👂 Subscribing to intent events...')
    
    try {
      await this.sdk.streams.subscribe({
        eventId: VIGILANT_EVENT_IDS.INTENT_SUBMITTED,
        onData: (data) => {
          console.log('📨 New intent event received:', data)
          callback(data)
        },
        onError: (error) => {
          console.error('❌ Intent stream error:', error)
        }
      })
    } catch (error) {
      console.error('❌ Failed to subscribe to intent events:', error)
    }
  }

  // Subscribe to simulation results using Event Streams
  async subscribeToSimulations(callback: (data: any) => void) {
    console.log('👂 Subscribing to simulation events...')
    
    try {
      await this.sdk.streams.subscribe({
        eventId: VIGILANT_EVENT_IDS.SIMULATION_RESULT,
        onData: (data) => {
          console.log('🔍 New simulation event received:', data)
          callback(data)
        },
        onError: (error) => {
          console.error('❌ Simulation stream error:', error)
        }
      })
    } catch (error) {
      console.error('❌ Failed to subscribe to simulation events:', error)
    }
  }

  // Subscribe to threat alerts using Event Streams
  async subscribeToThreats(callback: (data: any) => void) {
    console.log('👂 Subscribing to threat events...')
    
    try {
      await this.sdk.streams.subscribe({
        eventId: VIGILANT_EVENT_IDS.THREAT_ALERT,
        onData: (data) => {
          console.log('🚨 New threat event received:', data)
          callback(data)
        },
        onError: (error) => {
          console.error('❌ Threat stream error:', error)
        }
      })
    } catch (error) {
      console.error('❌ Failed to subscribe to threat events:', error)
    }
  }

  // Subscribe to status updates using Event Streams
  async subscribeToStatus(callback: (data: any) => void) {
    console.log('👂 Subscribing to status events...')
    
    try {
      await this.sdk.streams.subscribe({
        eventId: VIGILANT_EVENT_IDS.STATUS_UPDATE,
        onData: (data) => {
          console.log('� Status event received:', data)
          callback(data)
        },
        onError: (error) => {
          console.error('❌ Status stream error:', error)
        }
      })
    } catch (error) {
      console.error('❌ Failed to subscribe to status events:', error)
    }
  }

  // Publish intent data and emit event (setAndEmitEvents pattern)
  async publishIntent(intentData: any) {
    const dataSchemaId = this.getDataSchemaId('intent')
    if (!dataSchemaId) {
      throw new Error('Intent data schema not initialized')
    }

    try {
      // Prepare data stream for state storage
      const dataStreams = [{
        id: intentData.intentId,
        schemaId: dataSchemaId,
        data: intentData.encodedData
      }]

      // Prepare event stream for reactivity
      const eventStreams = [{
        id: VIGILANT_EVENT_IDS.INTENT_SUBMITTED,
        argumentTopics: [intentData.intentId, intentData.user],
        data: '0x' // Additional event data if needed
      }]

      // Write state and emit event atomically
      const txHash = await this.sdk.streams.setAndEmitEvents(dataStreams, eventStreams)
      console.log('✅ Intent published with event emission:', txHash)
      
      return txHash
    } catch (error) {
      console.error('❌ Failed to publish intent:', error)
      throw error
    }
  }

  // Emit simulation result event
  async emitSimulationResult(simulationData: any) {
    try {
      const eventStreams = [{
        id: VIGILANT_EVENT_IDS.SIMULATION_RESULT,
        argumentTopics: [simulationData.intentId, simulationData.simulator],
        data: simulationData.encodedResult
      }]

      const txHash = await this.sdk.streams.emitEvents(eventStreams)
      console.log('✅ Simulation result event emitted:', txHash)
      
      return txHash
    } catch (error) {
      console.error('❌ Failed to emit simulation result:', error)
      throw error
    }
  }

  // Emit status update event
  async emitStatusUpdate(statusData: any) {
    try {
      const eventStreams = [{
        id: VIGILANT_EVENT_IDS.STATUS_UPDATE,
        argumentTopics: [statusData.intentId],
        data: statusData.encodedStatus
      }]

      const txHash = await this.sdk.streams.emitEvents(eventStreams)
      console.log('✅ Status update event emitted:', txHash)
      
      return txHash
    } catch (error) {
      console.error('❌ Failed to emit status update:', error)
      throw error
    }
  }
}

// Singleton instance
export const vigilantStreams = new VigilantStreams()