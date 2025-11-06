/**
 * Vigilant MEV Protection Schemas for Somnia Data Streams
 * These schemas define the structure for intent broadcasting, simulator responses, and status updates
 */

// Schema for broadcasting transaction intents to simulator nodes
export const intentBroadcastSchema = `
  uint64 timestamp,
  bytes32 intentId,
  address sender,
  address targetContract,
  bytes callData,
  uint256 value,
  uint256 maxGasPrice,
  uint256 deadline,
  bytes32 riskProfile,
  uint8 urgency,
  string description
`

// Schema for simulator nodes to publish their analysis results
export const simulatorResponseSchema = `
  uint64 timestamp,
  bytes32 intentId,
  address simulator,
  uint8 riskScore,
  bool approved,
  string analysisDetails,
  bytes32 strategyRecommendation,
  uint256 gasEstimate,
  uint8 confidence
`

// Schema for real-time status updates throughout the verification process
export const intentStatusSchema = `
  uint64 timestamp,
  bytes32 intentId,
  uint8 status,
  uint256 consensusProgress,
  uint8 totalSimulators,
  uint8 approvedCount,
  uint8 rejectedCount,
  string statusMessage
`

// Schema for final execution results
export const executionResultSchema = `
  uint64 timestamp,
  bytes32 intentId,
  bool executed,
  bytes32 transactionHash,
  uint256 gasUsed,
  uint8 finalRiskScore,
  string executionDetails
`

// Schema for MEV protection analytics
export const mevAnalyticsSchema = `
  uint64 timestamp,
  bytes32 intentId,
  uint256 frontrunRisk,
  uint256 sandwichRisk,
  uint256 extractableValue,
  bool protectionRecommended,
  string riskFactors,
  uint256 blockNumber
`

// Schema for simulator node registration/heartbeat
export const simulatorNodeSchema = `
  uint64 timestamp,
  address nodeAddress,
  string nodeId,
  uint8 nodeStatus,
  uint256 lastActiveBlock,
  uint8 analysisCapacity,
  string nodeMetadata
`

// Intent status enum values
export const IntentStatus = {
  CREATED: 0,
  BROADCASTED: 1,
  ANALYZING: 2,
  CONSENSUS_PENDING: 3,
  APPROVED: 4,
  REJECTED: 5,
  EXECUTING: 6,
  EXECUTED: 7,
  FAILED: 8
} as const

// Risk profile enum values
export const RiskProfile = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
} as const

// Urgency levels
export const UrgencyLevel = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3
} as const

// Risk score ranges (0-100)
export const RiskScoreRanges = {
  LOW: { min: 0, max: 25 },
  MEDIUM: { min: 26, max: 50 },
  HIGH: { min: 51, max: 75 },
  CRITICAL: { min: 76, max: 100 }
} as const

// Node status values
export const NodeStatus = {
  ACTIVE: 0,
  INACTIVE: 1,
  MAINTENANCE: 2,
  OVERLOADED: 3
} as const

// Schema IDs will be computed from these schemas
export const SCHEMA_NAMES = {
  INTENT_BROADCAST: 'vigilant-intent-broadcast',
  SIMULATOR_RESPONSE: 'vigilant-simulator-response',
  INTENT_STATUS: 'vigilant-intent-status', 
  EXECUTION_RESULT: 'vigilant-execution-result',
  MEV_ANALYTICS: 'vigilant-mev-analytics',
  SIMULATOR_NODE: 'vigilant-simulator-node'
} as const