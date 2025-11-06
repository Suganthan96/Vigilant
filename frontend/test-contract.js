// Simple script to test contract connectivity
import { createPublicClient, http } from 'viem'

const client = createPublicClient({
  chain: {
    id: 50312,
    name: 'Somnia Network',
    network: 'somnia',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: ['https://dream-rpc.somnia.network'] },
      public: { http: ['https://dream-rpc.somnia.network'] },
    },
  },
  transport: http('https://dream-rpc.somnia.network')
})

async function testContract() {
  try {
    // Test basic RPC connectivity
    const blockNumber = await client.getBlockNumber()
    console.log('Current block number:', blockNumber)
    
    // Test contract exists
    const contractCode = await client.getBytecode({
      address: '0x0b1Cd4df8E32Fc97022F54D1671F5f49b8549852'
    })
    
    console.log('Contract exists:', contractCode ? 'YES' : 'NO')
    console.log('Contract code length:', contractCode ? contractCode.length : 0)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testContract()