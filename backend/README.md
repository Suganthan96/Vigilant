# Vigilant Security Protocol - Backend

Multi-layer real-time Web3 security protocol backend services powered by Somnia Data Streams SDK.

## Features

- 🛡️ **Real-time Mempool Monitoring** - Detect front-running attempts and mempool manipulation
- 🔍 **Instant State Change Detection** - Monitor contract state changes during verification
- 🤝 **Multi-node Simulation Consensus** - Coordinate multiple validator nodes for risk assessment
- 📡 **Live Risk Score Broadcasting** - Real-time risk updates via Somnia Data Streams
- ⚡ **Sub-second Alert Propagation** - Immediate threat notifications
- 🔐 **Privy Wallet Integration** - Secure wallet connections without exposing private keys

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `RPC_URL` - Somnia testnet RPC endpoint
- `PRIVATE_KEY` - Funded wallet private key for schema registration
- `PRIVY_APP_ID` - Privy application ID
- `PRIVY_APP_SECRET` - Privy application secret

### 3. Register Schemas

Before running the application, register the data schemas:

```bash
# Compute schema IDs (optional - for verification)
npm run compute-schema

# Register schemas on Somnia Data Streams
npm run register-schema

# Test schema encoding/decoding (optional)
npm run test-encode
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on:
- HTTP API: `http://localhost:3001`
- WebSocket: `ws://localhost:3002`

## Project Structure

```
backend/
├── src/
│   ├── lib/
│   │   ├── chain.ts          # Somnia testnet configuration
│   │   ├── clients.ts        # Viem client setup
│   │   └── schemas.ts        # Data stream schemas
│   ├── services/             # Core services (to be implemented)
│   │   ├── sds-manager.ts    # Somnia Data Streams management
│   │   ├── mempool-monitor.ts # Mempool threat detection
│   │   ├── state-monitor.ts   # Contract state monitoring
│   │   └── intent-manager.ts  # Transaction intent lifecycle
│   └── index.ts              # Main server entry point
├── scripts/
│   ├── compute-schema-id.ts  # Calculate schema IDs
│   ├── register-schema.ts    # Register schemas on-chain
│   └── encode-decode.ts      # Test schema encoding
└── package.json
```

## API Endpoints

### Health Check
```
GET /health
```

### Status
```
GET /api/status
```

More endpoints will be added as services are implemented.

## Data Schemas

The Vigilant protocol uses structured data schemas for Somnia Data Streams:

- **Intent Schema** - Transaction intents submitted for verification
- **Risk Schema** - Simulation results and risk assessments
- **Alert Schema** - Real-time security alerts and notifications
- **Mempool Threat Schema** - Front-running and manipulation detection
- **State Change Schema** - Contract state modification tracking

## Development

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

### Scripts
```bash
npm run compute-schema    # Compute schema IDs
npm run register-schema   # Register schemas on-chain
npm run test-encode      # Test schema encoding/decoding
```

## Next Steps

1. Implement SDS Manager service for data streaming
2. Add Mempool Monitor for threat detection
3. Create State Monitor for contract surveillance
4. Build Simulation Coordinator for multi-node consensus
5. Integrate Privy wallet authentication
6. Add comprehensive API endpoints
7. Implement real-time WebSocket broadcasting

## License

MIT