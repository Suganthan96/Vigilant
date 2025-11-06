/**
 * Vigilant Security Protocol - Data Schemas
 * 
 * These schemas define the structure for data streaming via Somnia Data Streams SDK.
 * Field order and types are critical - changing them creates new schema IDs.
 */

/**
 * Transaction Intent Schema
 * Stores transaction intents submitted for security verification
 */
export const intentSchema = 
  'bytes32 intentId, address user, address target, bytes callData, uint256 value, uint64 timestamp, uint64 deadline, uint8 status, bytes32 stateSnapshot'

/**
 * Risk Assessment Schema  
 * Stores simulation results and risk scores from validator nodes
 */
export const riskSchema =
  'bytes32 intentId, address simulator, uint8 riskScore, bool isRisky, string threats, uint64 timestamp, bytes32 resultHash'

/**
 * Security Alert Schema
 * Real-time alerts for mempool threats and state changes
 */
export const alertSchema = 
  'bytes32 intentId, uint8 alertType, uint8 severity, string description, bytes evidence, uint64 timestamp, address source'

/**
 * Mempool Threat Schema
 * Tracks potential front-running and mempool manipulation attempts
 */
export const mempoolThreatSchema =
  'bytes32 intentId, bytes32 threatTxHash, uint8 threatLevel, uint256 gasPrice, string threatType, uint64 timestamp'

/**
 * State Change Schema
 * Monitors contract state modifications during verification
 */
export const stateChangeSchema =
  'bytes32 intentId, address contractAddress, bytes32 slot, bytes32 oldValue, bytes32 newValue, bytes32 txHash, uint64 timestamp'

/**
 * Schema type definitions for TypeScript
 */
export interface IntentData {
  intentId: string
  user: string
  target: string
  callData: string
  value: bigint
  timestamp: number
  deadline: number
  status: IntentStatus
  stateSnapshot: string
}

export interface RiskData {
  intentId: string
  simulator: string
  riskScore: number
  isRisky: boolean
  threats: string
  timestamp: number
  resultHash: string
}

export interface AlertData {
  intentId: string
  alertType: AlertType
  severity: AlertSeverity
  description: string
  evidence: string
  timestamp: number
  source: string
}

export interface MempoolThreatData {
  intentId: string
  threatTxHash: string
  threatLevel: ThreatLevel
  gasPrice: bigint
  threatType: string
  timestamp: number
}

export interface StateChangeData {
  intentId: string
  contractAddress: string
  slot: string
  oldValue: string
  newValue: string
  txHash: string
  timestamp: number
}

/**
 * Enums for schema fields
 */
export enum IntentStatus {
  PENDING = 0,
  VERIFYING = 1,
  APPROVED = 2,
  BLOCKED = 3,
  EXECUTED = 4,
  EXPIRED = 5
}

export enum AlertType {
  MEMPOOL_THREAT = 0,
  STATE_CHANGE = 1,
  SIMULATION_FAILURE = 2,
  CONSENSUS_CONFLICT = 3,
  EXECUTION_BLOCKED = 4
}

export enum AlertSeverity {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

export enum ThreatLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Schema registry for easy access
 */
export const SCHEMAS = {
  INTENT: {
    id: 'vigilant_intent',
    schema: intentSchema
  },
  RISK: {
    id: 'vigilant_risk',
    schema: riskSchema
  },
  ALERT: {
    id: 'vigilant_alert', 
    schema: alertSchema
  },
  MEMPOOL_THREAT: {
    id: 'vigilant_mempool_threat',
    schema: mempoolThreatSchema
  },
  STATE_CHANGE: {
    id: 'vigilant_state_change',
    schema: stateChangeSchema
  }
} as const