/**
 * Vigilant MEV Protection Demo
 * Demonstrates the complete real-time workflow using Somnia Data Streams
 */

import 'dotenv/config'
import { getVigilantStreams } from '../src/lib/realVigilantStreams'
import { VigilantSimulatorNode } from '../src/simulatorNode'
import { IntentStatus } from '../src/lib/vigilantSchemas'
import { randomBytes } from 'crypto'

async function runVigilantDemo() {
  console.log('🚀 Starting Vigilant MEV Protection Demo with Real Somnia Data Streams')
  console.log('='.repeat(80))

  // Configuration
  const config = {
    rpcUrl: process.env.RPC_URL!,
    wsUrl: process.env.WS_URL,
    privateKey: process.env.PRIVATE_KEY!
  }

  try {
    // 1. Initialize Vigilant Streams
    console.log('\n📡 Step 1: Initializing Vigilant Data Streams...')
    const vigilantStreams = getVigilantStreams(config)
    await vigilantStreams.initialize()
    console.log('✅ Vigilant Streams initialized')

    // 2. Start multiple simulator nodes
    console.log('\n🤖 Step 2: Starting MEV Protection Simulator Network...')
    const simulatorNodes: VigilantSimulatorNode[] = []
    
    for (let i = 0; i < 3; i++) {
      const nodeAddress = `0x${randomBytes(20).toString('hex')}`
      const simulator = new VigilantSimulatorNode(nodeAddress, config.privateKey)
      await simulator.start()
      simulatorNodes.push(simulator)
      console.log(`✅ Simulator node ${i + 1} started: ${nodeAddress.slice(0, 10)}...`)
    }

    // 3. Create a mock transaction intent
    console.log('\n💭 Step 3: Creating transaction intent...')
    const intentId = '0x' + randomBytes(32).toString('hex')
    const mockIntent = {
      intentId,
      sender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      targetContract: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI token
      callData: '0xa9059cbb000000000000000000000000742d35cc6500000000000000000000000000000000000000000000000000000000000de0b6b3a7640000',
      value: BigInt(0),
      maxGasPrice: BigInt(30e9), // 30 gwei
      deadline: BigInt(Math.floor(Date.now() / 1000) + 300), // 5 minutes from now
      description: 'UNI token transfer - 1000 UNI'
    }
    
    console.log(`📋 Intent created: ${intentId}`)
    console.log(`   Target: ${mockIntent.targetContract}`)
    console.log(`   Description: ${mockIntent.description}`)

    // 4. Publish initial status update
    console.log('\n📊 Step 4: Publishing intent status updates...')
    await vigilantStreams.publishStatusUpdate({
      intentId,
      status: IntentStatus.CREATED,
      consensusProgress: BigInt(0),
      totalSimulators: simulatorNodes.length,
      approvedCount: 0,
      rejectedCount: 0,
      statusMessage: 'Intent created, broadcasting to simulator network...'
    })

    // 5. Broadcast intent to simulators (simulate)
    console.log('\n🔄 Step 5: Broadcasting intent to simulator network...')
    await vigilantStreams.publishStatusUpdate({
      intentId,
      status: IntentStatus.BROADCASTED,
      consensusProgress: BigInt(0),
      totalSimulators: simulatorNodes.length,
      approvedCount: 0,
      rejectedCount: 0,
      statusMessage: 'Intent broadcasted to simulator network'
    })

    // 6. Simulate MEV analysis by all nodes
    console.log('\n🔍 Step 6: Running MEV analysis on all simulator nodes...')
    await vigilantStreams.publishStatusUpdate({
      intentId,
      status: IntentStatus.ANALYZING,
      consensusProgress: BigInt(0),
      totalSimulators: simulatorNodes.length,
      approvedCount: 0,
      rejectedCount: 0,
      statusMessage: 'Simulators analyzing transaction for MEV risks...'
    })

    const analysisResults = []
    for (let i = 0; i < simulatorNodes.length; i++) {
      const simulator = simulatorNodes[i]
      console.log(`   Analyzing on simulator ${i + 1}...`)
      
      const result = await simulator.analyzeIntent(mockIntent)
      analysisResults.push(result)
      
      console.log(`   ✅ Simulator ${i + 1}: Risk Score ${result.riskScore}, Approved: ${result.approved}`)
      
      // Update progress
      const progress = ((i + 1) / simulatorNodes.length) * 0.8 // 80% progress during analysis
      await vigilantStreams.publishStatusUpdate({
        intentId,
        status: IntentStatus.ANALYZING,
        consensusProgress: BigInt(Math.floor(progress * 100)),
        totalSimulators: simulatorNodes.length,
        approvedCount: analysisResults.filter(r => r.approved).length,
        rejectedCount: analysisResults.filter(r => !r.approved).length,
        statusMessage: `Analysis progress: ${Math.floor(progress * 100)}%`
      })
    }

    // 7. Calculate consensus
    console.log('\n🏛️ Step 7: Calculating consensus...')
    const approvedCount = analysisResults.filter(r => r.approved).length
    const rejectedCount = analysisResults.filter(r => !r.approved).length
    const consensusReached = approvedCount > rejectedCount
    const avgRiskScore = analysisResults.reduce((sum, r) => sum + r.riskScore, 0) / analysisResults.length

    await vigilantStreams.publishStatusUpdate({
      intentId,
      status: IntentStatus.CONSENSUS_PENDING,
      consensusProgress: BigInt(90),
      totalSimulators: simulatorNodes.length,
      approvedCount,
      rejectedCount,
      statusMessage: `Consensus calculation: ${approvedCount}/${simulatorNodes.length} approved`
    })

    console.log(`📊 Consensus Results:`)
    console.log(`   Approved: ${approvedCount}`)
    console.log(`   Rejected: ${rejectedCount}`)
    console.log(`   Average Risk Score: ${avgRiskScore.toFixed(1)}`)
    console.log(`   Consensus: ${consensusReached ? 'APPROVED' : 'REJECTED'}`)

    // 8. Final decision
    console.log('\n⚖️ Step 8: Final decision...')
    if (consensusReached && avgRiskScore < 50) {
      await vigilantStreams.publishStatusUpdate({
        intentId,
        status: IntentStatus.APPROVED,
        consensusProgress: BigInt(100),
        totalSimulators: simulatorNodes.length,
        approvedCount,
        rejectedCount,
        statusMessage: 'Intent APPROVED - Safe for execution'
      })
      
      console.log('✅ Intent APPROVED for execution')
      console.log('   The transaction is safe from MEV attacks')
      
      // Simulate execution
      setTimeout(async () => {
        console.log('\n🚀 Step 9: Executing transaction...')
        await vigilantStreams.publishStatusUpdate({
          intentId,
          status: IntentStatus.EXECUTING,
          consensusProgress: BigInt(100),
          totalSimulators: simulatorNodes.length,
          approvedCount,
          rejectedCount,
          statusMessage: 'Executing transaction with MEV protection...'
        })
        
        // Simulate successful execution
        setTimeout(async () => {
          const mockTxHash = '0x' + randomBytes(32).toString('hex')
          await vigilantStreams.publishStatusUpdate({
            intentId,
            status: IntentStatus.EXECUTED,
            consensusProgress: BigInt(100),
            totalSimulators: simulatorNodes.length,
            approvedCount,
            rejectedCount,
            statusMessage: `Transaction executed successfully: ${mockTxHash}`
          })
          
          console.log(`✅ Transaction executed successfully!`)
          console.log(`   Transaction Hash: ${mockTxHash}`)
          console.log(`   Final Risk Score: ${avgRiskScore.toFixed(1)}`)
          
          // Cleanup
          await cleanup(simulatorNodes, vigilantStreams)
        }, 2000)
      }, 2000)
      
    } else {
      await vigilantStreams.publishStatusUpdate({
        intentId,
        status: IntentStatus.REJECTED,
        consensusProgress: BigInt(100),
        totalSimulators: simulatorNodes.length,
        approvedCount,
        rejectedCount,
        statusMessage: 'Intent REJECTED - High MEV risk detected'
      })
      
      console.log('❌ Intent REJECTED')
      console.log('   High MEV risk detected - transaction blocked for protection')
      
      // Cleanup
      await cleanup(simulatorNodes, vigilantStreams)
    }

  } catch (error) {
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

async function cleanup(simulatorNodes: VigilantSimulatorNode[], vigilantStreams: any) {
  console.log('\n🧹 Cleaning up...')
  
  // Stop all simulator nodes
  for (const simulator of simulatorNodes) {
    await simulator.stop()
  }
  
  // Cleanup streams
  await vigilantStreams.cleanup()
  
  console.log('✅ Demo completed successfully!')
  console.log('\n' + '='.repeat(80))
  console.log('🛡️ Vigilant MEV Protection Demo Summary:')
  console.log('• Real-time intent broadcasting via Somnia Data Streams')
  console.log('• Decentralized simulator network analysis')
  console.log('• Consensus-based MEV risk assessment')
  console.log('• Live status updates throughout the process')
  console.log('• Protected transaction execution')
  console.log('='.repeat(80))
  
  process.exit(0)
}

// Run the demo
if (require.main === module) {
  runVigilantDemo().catch(error => {
    console.error('❌ Demo startup failed:', error)
    process.exit(1)
  })
}

export { runVigilantDemo }