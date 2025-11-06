// Vigilant Data Streams Schemas
// These schemas define the structure for intent submission and simulation results

// Schema for Transaction Intent submissions
export const INTENT_SCHEMA = 
  'bytes32 intentId, address user, address target, uint256 value, bytes callData, uint64 timestamp, uint256 deadline'

// Schema for Simulation Results
export const SIMULATION_SCHEMA = 
  'bytes32 intentId, address simulator, bool isRisky, uint256 riskScore, bytes32 resultHash, uint64 timestamp'

// Schema for Intent Status Updates  
export const INTENT_STATUS_SCHEMA = 
  'bytes32 intentId, uint8 status, bool isSafe, uint256 avgRiskScore, uint64 timestamp'

// Event IDs for Somnia Streams
export const VIGILANT_EVENTS = {
  INTENT_SUBMITTED: 'VigilantIntentSubmitted',
  SIMULATION_RESULT: 'VigilantSimulationResult', 
  INTENT_STATUS_UPDATE: 'VigilantStatusUpdate'
} as const

// Schema IDs will be computed from the schema strings
export type VigilantEventId = typeof VIGILANT_EVENTS[keyof typeof VIGILANT_EVENTS]