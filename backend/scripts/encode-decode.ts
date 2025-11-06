import 'dotenv/config'
import { SchemaEncoder } from '@somnia-chain/streams'
import { toHex, type Hex } from 'viem'
import { SCHEMAS, IntentStatus, AlertType, AlertSeverity } from '../src/lib/schemas'

/**
 * Test schema encoding and decoding for Vigilant schemas
 * This validates that our schema definitions work correctly
 */
async function main() {
  console.log('🧪 Testing Vigilant Schema Encoding/Decoding...\n')
  
  // Test Intent Schema
  console.log('📋 Testing Intent Schema:')
  const intentEncoder = new SchemaEncoder(SCHEMAS.INTENT.schema)
  
  const intentData: Hex = intentEncoder.encodeData([
    { name: 'intentId', value: toHex('test-intent-123', { size: 32 }), type: 'bytes32' },
    { name: 'user', value: '0x1234567890123456789012345678901234567890', type: 'address' },
    { name: 'target', value: '0x0987654321098765432109876543210987654321', type: 'address' },
    { name: 'callData', value: '0x095ea7b3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', type: 'bytes' },
    { name: 'value', value: '1000000000000000000', type: 'uint256' }, // 1 ETH
    { name: 'timestamp', value: Date.now().toString(), type: 'uint64' },
    { name: 'deadline', value: (Date.now() + 60000).toString(), type: 'uint64' }, // 1 minute from now
    { name: 'status', value: IntentStatus.PENDING.toString(), type: 'uint8' },
    { name: 'stateSnapshot', value: toHex('state-snapshot-hash', { size: 32 }), type: 'bytes32' }
  ])
  
  console.log('   Encoded:', intentData)
  console.log('   Decoded:', intentEncoder.decodeData(intentData))
  console.log('')
  
  // Test Risk Schema
  console.log('📊 Testing Risk Schema:')
  const riskEncoder = new SchemaEncoder(SCHEMAS.RISK.schema)
  
  const riskData: Hex = riskEncoder.encodeData([
    { name: 'intentId', value: toHex('test-intent-123', { size: 32 }), type: 'bytes32' },
    { name: 'simulator', value: '0x1111111111111111111111111111111111111111', type: 'address' },
    { name: 'riskScore', value: '75', type: 'uint8' },
    { name: 'isRisky', value: 'true', type: 'bool' },
    { name: 'threats', value: 'front_running_detected,high_gas_price', type: 'string' },
    { name: 'timestamp', value: Date.now().toString(), type: 'uint64' },
    { name: 'resultHash', value: toHex('simulation-result-hash', { size: 32 }), type: 'bytes32' }
  ])
  
  console.log('   Encoded:', riskData)
  console.log('   Decoded:', riskEncoder.decodeData(riskData))
  console.log('')
  
  // Test Alert Schema
  console.log('🚨 Testing Alert Schema:')
  const alertEncoder = new SchemaEncoder(SCHEMAS.ALERT.schema)
  
  const alertData: Hex = alertEncoder.encodeData([
    { name: 'intentId', value: toHex('test-intent-123', { size: 32 }), type: 'bytes32' },
    { name: 'alertType', value: AlertType.MEMPOOL_THREAT.toString(), type: 'uint8' },
    { name: 'severity', value: AlertSeverity.HIGH.toString(), type: 'uint8' },
    { name: 'description', value: 'Front-running attempt detected in mempool', type: 'string' },
    { name: 'evidence', value: '0x1234abcd', type: 'bytes' },
    { name: 'timestamp', value: Date.now().toString(), type: 'uint64' },
    { name: 'source', value: '0x2222222222222222222222222222222222222222', type: 'address' }
  ])
  
  console.log('   Encoded:', alertData)
  console.log('   Decoded:', alertEncoder.decodeData(alertData))
  console.log('')
  
  console.log('✅ All schema tests passed!')
}

main().catch((error) => {
  console.error('💥 Schema test failed:', error)
  process.exit(1)
})