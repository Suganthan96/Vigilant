// Vigilant Data Streams Schemas
// These schemas define the structure for broadcasting intent and simulation data

// Schema for Transaction Intents
export const intentSchema = 
  'bytes32 intentId, address user, address target, bytes callData, uint256 value, uint256 timestamp, uint256 deadline'

// Schema for Simulation Results  
export const simulationSchema =
  'bytes32 intentId, address simulator, bytes32 resultHash, bool isRisky, uint256 riskScore, uint256 timestamp'

// Schema for Threat Alerts
export const threatSchema = 
  'bytes32 intentId, address threatTarget, uint256 threatLevel, string reason, uint256 timestamp'

// Schema for Real-time Status Updates
export const statusSchema =
  'bytes32 intentId, uint8 status, uint256 consensusCount, uint256 avgRiskScore, uint256 timestamp'

export const schemas = {
  intent: intentSchema,
  simulation: simulationSchema, 
  threat: threatSchema,
  status: statusSchema
} as const

export type SchemaType = keyof typeof schemas