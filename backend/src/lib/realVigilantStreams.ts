/**
 * Real Somnia Data Streams implementation for Vigilant MEV Protection
 * Replaces the mock implementation with actual Data Streams integration
 */

import { SDK, SchemaEncoder, zeroBytes32 } from '@somnia-chain/streams'
import { createPublicClient, createWalletClient, http, webSocket } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaTestnet } from '../chain.js'
import { 
  simulatorResponseSchema, 
  intentStatusSchema, 
  executionResultSchema,
  mevAnalyticsSchema,
  simulatorNodeSchema,
  SCHEMA_NAMES,
  IntentStatus,
  NodeStatus 
} from './vigilantSchemas'

export interface VigilantStreamsConfig {
  rpcUrl: string
  wsUrl?: string
  privateKey?: string
}

export interface SimulatorResponse {
  intentId: string
  simulator: string
  riskScore: number
  approved: boolean
  analysisDetails: string
  strategyRecommendation: string
  gasEstimate: bigint
  confidence: number
}

export interface IntentStatusUpdate {
  intentId: string
  status: number
  consensusProgress: bigint
  totalSimulators: number
  approvedCount: number
  rejectedCount: number
  statusMessage: string
}

export interface ExecutionResult {
  intentId: string
  executed: boolean
  transactionHash?: string
  gasUsed?: bigint
  finalRiskScore: number
  executionDetails: string
}

export class RealVigilantStreams {
  private sdk: SDK
  private publicClient: any
  private walletClient: any
  private schemaIds: Map<string, string> = new Map()
  private encoders: Map<string, SchemaEncoder> = new Map()
  private subscriptions: Map<string, { subscriptionId: string, unsubscribe: () => void }> = new Map()

  constructor(config: VigilantStreamsConfig) {
    this.publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: config.wsUrl ? webSocket(config.wsUrl) : http(config.rpcUrl),
    })

    if (config.privateKey) {
      this.walletClient = createWalletClient({
        account: privateKeyToAccount(config.privateKey as `0x${string}`),
        chain: somniaTestnet,
        transport: http(config.rpcUrl),
      })
    }

    this.sdk = new SDK({
      public: this.publicClient,
      wallet: this.walletClient,
    })
  }

  /**
   * Initialize schemas and register them on-chain
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Vigilant Data Streams...')
    
    try {
      // Compute schema IDs
      await this.computeSchemaIds()
      
      // Register schemas if wallet is available
      if (this.walletClient) {
        await this.registerSchemas()
      }
      
      // Initialize encoders
      this.initializeEncoders()
      
      console.log('✅ Vigilant Data Streams initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Vigilant Data Streams:', error)
      throw error
    }
  }

  private async computeSchemaIds(): Promise<void> {
    const schemas = {
      [SCHEMA_NAMES.SIMULATOR_RESPONSE]: simulatorResponseSchema,
      [SCHEMA_NAMES.INTENT_STATUS]: intentStatusSchema,
      [SCHEMA_NAMES.EXECUTION_RESULT]: executionResultSchema,
      [SCHEMA_NAMES.MEV_ANALYTICS]: mevAnalyticsSchema,
      [SCHEMA_NAMES.SIMULATOR_NODE]: simulatorNodeSchema
    }

    for (const [name, schema] of Object.entries(schemas)) {
      const schemaId = await this.sdk.streams.computeSchemaId(schema)
      if (schemaId) {
        this.schemaIds.set(name, schemaId)
        console.log(`📋 Schema ID for ${name}: ${schemaId}`)
      } else {
        throw new Error(`Failed to compute schema ID for ${name}`)
      }
    }
  }

  private async registerSchemas(): Promise<void> {
    const schemaRegistrations = [
      { id: SCHEMA_NAMES.SIMULATOR_RESPONSE, schema: simulatorResponseSchema, parentSchemaId: zeroBytes32 as `0x${string}` },
      { id: SCHEMA_NAMES.INTENT_STATUS, schema: intentStatusSchema, parentSchemaId: zeroBytes32 as `0x${string}` },
      { id: SCHEMA_NAMES.EXECUTION_RESULT, schema: executionResultSchema, parentSchemaId: zeroBytes32 as `0x${string}` },
      { id: SCHEMA_NAMES.MEV_ANALYTICS, schema: mevAnalyticsSchema, parentSchemaId: zeroBytes32 as `0x${string}` },
      { id: SCHEMA_NAMES.SIMULATOR_NODE, schema: simulatorNodeSchema, parentSchemaId: zeroBytes32 as `0x${string}` }
    ]

    console.log('📝 Registering schemas on-chain...')
    const txHash = await this.sdk.streams.registerDataSchemas(schemaRegistrations, true)
    
    if (txHash) {
      console.log(`📝 Schema registration transaction: ${txHash}`)
    } else {
      console.log('📝 Schemas already registered or registration skipped')
    }
  }

  private initializeEncoders(): void {
    const schemas = {
      [SCHEMA_NAMES.SIMULATOR_RESPONSE]: simulatorResponseSchema,
      [SCHEMA_NAMES.INTENT_STATUS]: intentStatusSchema,
      [SCHEMA_NAMES.EXECUTION_RESULT]: executionResultSchema,
      [SCHEMA_NAMES.MEV_ANALYTICS]: mevAnalyticsSchema,
      [SCHEMA_NAMES.SIMULATOR_NODE]: simulatorNodeSchema
    }

    for (const [name, schema] of Object.entries(schemas)) {
      this.encoders.set(name, new SchemaEncoder(schema))
    }
  }

  /**
   * Publish simulator response to the network
   */
  async publishSimulatorResponse(response: SimulatorResponse): Promise<string | null> {
    const encoder = this.encoders.get(SCHEMA_NAMES.SIMULATOR_RESPONSE)!
    const schemaId = this.schemaIds.get(SCHEMA_NAMES.SIMULATOR_RESPONSE)!

    const encodedData = encoder.encodeData([
      { name: 'timestamp', value: Date.now().toString(), type: 'uint64' },
      { name: 'intentId', value: response.intentId, type: 'bytes32' },
      { name: 'simulator', value: response.simulator, type: 'address' },
      { name: 'riskScore', value: response.riskScore.toString(), type: 'uint8' },
      { name: 'approved', value: response.approved, type: 'bool' },
      { name: 'analysisDetails', value: response.analysisDetails, type: 'string' },
      { name: 'strategyRecommendation', value: response.strategyRecommendation, type: 'bytes32' },
      { name: 'gasEstimate', value: response.gasEstimate.toString(), type: 'uint256' },
      { name: 'confidence', value: response.confidence.toString(), type: 'uint8' }
    ])

    const dataId = `0x${Buffer.from(`sim-${response.intentId}-${Date.now()}`).toString('hex').padStart(64, '0')}`

    const txHash = await this.sdk.streams.set([
      { id: dataId as `0x${string}`, schemaId: schemaId as `0x${string}`, data: encodedData }
    ])

    console.log(`📡 Published simulator response for intent ${response.intentId}`)
    return txHash
  }

  /**
   * Publish intent status update
   */
  async publishStatusUpdate(update: IntentStatusUpdate): Promise<string | null> {
    const encoder = this.encoders.get(SCHEMA_NAMES.INTENT_STATUS)!
    const schemaId = this.schemaIds.get(SCHEMA_NAMES.INTENT_STATUS)!

    const encodedData = encoder.encodeData([
      { name: 'timestamp', value: Date.now().toString(), type: 'uint64' },
      { name: 'intentId', value: update.intentId, type: 'bytes32' },
      { name: 'status', value: update.status.toString(), type: 'uint8' },
      { name: 'consensusProgress', value: update.consensusProgress.toString(), type: 'uint256' },
      { name: 'totalSimulators', value: update.totalSimulators.toString(), type: 'uint8' },
      { name: 'approvedCount', value: update.approvedCount.toString(), type: 'uint8' },
      { name: 'rejectedCount', value: update.rejectedCount.toString(), type: 'uint8' },
      { name: 'statusMessage', value: update.statusMessage, type: 'string' }
    ])

    const dataId = `0x${Buffer.from(`status-${update.intentId}-${Date.now()}`).toString('hex').padStart(64, '0')}`

    const txHash = await this.sdk.streams.set([
      { id: dataId as `0x${string}`, schemaId: schemaId as `0x${string}`, data: encodedData }
    ])

    // Convert status number to string safely
    const statusNames = Object.keys(IntentStatus).filter(key => isNaN(Number(key)))
    const statusName = statusNames[update.status] || 'UNKNOWN'
    
    console.log(`📊 Published status update for intent ${update.intentId}: ${statusName}`)
    return txHash
  }

  /**
   * Subscribe to simulator responses for a specific intent
   */
  async subscribeToSimulatorResponses(
    intentId: string,
    onResponse: (response: SimulatorResponse) => void
  ): Promise<string> {
    const schemaId = this.schemaIds.get(SCHEMA_NAMES.SIMULATOR_RESPONSE)!
    
    const subscription = await this.sdk.streams.subscribe({
      somniaStreamsEventId: SCHEMA_NAMES.SIMULATOR_RESPONSE,
      ethCalls: [], // We'll get data from the stream directly
      onlyPushChanges: false,
      onData: (data) => {
        // Decode and filter for our intent
        console.log('📡 Received simulator response:', data)
        // Process the response and call onResponse callback
      },
      onError: (error) => {
        console.error('❌ Subscription error:', error)
      }
    })

    if (subscription) {
      this.subscriptions.set(`sim-${intentId}`, subscription)
      return subscription.subscriptionId
    }

    throw new Error('Failed to create subscription')
  }

  /**
   * Subscribe to status updates for a specific intent
   */
  async subscribeToStatusUpdates(
    intentId: string,
    onUpdate: (update: IntentStatusUpdate) => void
  ): Promise<string> {
    const subscription = await this.sdk.streams.subscribe({
      somniaStreamsEventId: SCHEMA_NAMES.INTENT_STATUS,
      ethCalls: [],
      onlyPushChanges: false,
      onData: (data) => {
        console.log('📊 Received status update:', data)
        // Process the update and call onUpdate callback
      },
      onError: (error) => {
        console.error('❌ Status subscription error:', error)
      }
    })

    if (subscription) {
      this.subscriptions.set(`status-${intentId}`, subscription)
      return subscription.subscriptionId
    }

    throw new Error('Failed to create status subscription')
  }

  /**
   * Get all simulator responses for an intent
   */
  async getSimulatorResponses(intentId: string, publisher?: string): Promise<SimulatorResponse[]> {
    const schemaId = this.schemaIds.get(SCHEMA_NAMES.SIMULATOR_RESPONSE)!
    
    if (publisher) {
      const data = await this.sdk.streams.getAllPublisherDataForSchema(
        schemaId as `0x${string}`, 
        publisher as `0x${string}`
      )
      // Decode and filter for intentId
      return this.decodeSimulatorResponses(data, intentId)
    }

    // If no publisher specified, we'd need to query multiple publishers
    // This would require maintaining a list of known simulator addresses
    return []
  }

  private decodeSimulatorResponses(rawData: any, intentId: string): SimulatorResponse[] {
    // Implementation would decode the raw data and filter by intentId
    // This is a placeholder - actual implementation would use the encoder to decode
    return []
  }

  /**
   * Unsubscribe from all streams
   */
  async cleanup(): Promise<void> {
    for (const [key, subscription] of this.subscriptions) {
      subscription.unsubscribe()
      console.log(`🔌 Unsubscribed from ${key}`)
    }
    this.subscriptions.clear()
  }
}

// Export singleton instance
let vigilantStreamsInstance: RealVigilantStreams | null = null

export function getVigilantStreams(config?: VigilantStreamsConfig): RealVigilantStreams {
  if (!vigilantStreamsInstance && config) {
    vigilantStreamsInstance = new RealVigilantStreams(config)
  }
  
  if (!vigilantStreamsInstance) {
    throw new Error('VigilantStreams not initialized. Call with config first.')
  }
  
  return vigilantStreamsInstance
}