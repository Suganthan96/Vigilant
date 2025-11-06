import { Abi } from 'viem'

/**
 * VigilantIntentCreator Contract Interface
 * Simple contract focused only on intent creation using Somnia Data Streams
 */

export const VIGILANT_INTENT_CREATOR_ADDRESS = '0x1234567890123456789012345678901234567890' // Will be updated after deployment

export const VIGILANT_INTENT_CREATOR_ABI: Abi = [
  {
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_intentSchemaId', type: 'bytes32' }
    ]
  },
  {
    type: 'function',
    name: 'createIntent',
    stateMutability: 'payable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'callData', type: 'bytes' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint64' }
    ],
    outputs: [
      { name: 'intentId', type: 'bytes32' }
    ]
  },
  {
    type: 'function',
    name: 'getIntent',
    stateMutability: 'view',
    inputs: [
      { name: 'intentId', type: 'bytes32' }
    ],
    outputs: [
      { name: 'user', type: 'address' },
      { name: 'target', type: 'address' },
      { name: 'callData', type: 'bytes' },
      { name: 'value', type: 'uint256' },
      { name: 'timestamp', type: 'uint64' },
      { name: 'deadline', type: 'uint64' },
      { name: 'status', type: 'uint8' },
      { name: 'stateSnapshot', type: 'bytes32' }
    ]
  },
  {
    type: 'function',
    name: 'VERIFICATION_FEE',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    type: 'function',
    name: 'intentSchemaId',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32' }
    ]
  },
  {
    type: 'function',
    name: 'insurancePool',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    type: 'event',
    name: 'IntentCreated',
    inputs: [
      { name: 'intentId', type: 'bytes32', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'target', type: 'address', indexed: true },
      { name: 'callData', type: 'bytes' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint64' }
    ]
  }
] as const

// TypeScript types for better type safety
export interface TransactionIntent {
  user: string
  target: string
  callData: string
  value: bigint
  timestamp: number
  deadline: number
  status: IntentStatus
  stateSnapshot: string
}

export enum IntentStatus {
  PENDING = 0,
  VERIFYING = 1,
  APPROVED = 2,
  BLOCKED = 3,
  EXECUTED = 4,
  EXPIRED = 5
}

export interface CreateIntentParams {
  target: string
  callData: string
  value: string // ETH amount as string
  deadline?: number // Optional, defaults to 60 seconds from now
}

export interface IntentCreationResult {
  intentId: string
  transactionHash: string
  blockNumber: bigint
  user: string
  target: string
  value: bigint
  deadline: number
}