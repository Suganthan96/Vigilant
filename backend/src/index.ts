import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

/**
 * Vigilant Security Protocol - Backend Server
 * 
 * Main entry point for the Vigilant backend services including:
 * - REST API for intent submission and status queries
 * - WebSocket server for real-time updates
 * - Somnia Data Streams integration
 * - Mempool and state monitoring services
 */

const app = express()
const PORT = process.env.PORT || 3001
const WS_PORT = process.env.WS_PORT || 3002

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'vigilant-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API routes placeholder
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'Vigilant Security Protocol API',
    endpoints: {
      health: '/health',
      status: '/api/status',
      // More endpoints will be added as services are implemented
    }
  })
})

// Start HTTP server
const server = createServer(app)

server.listen(PORT, () => {
  console.log('🛡️  Vigilant Security Protocol Backend')
  console.log(`📡 HTTP Server running on port ${PORT}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
})

// Start WebSocket server for real-time updates
const wss = new WebSocketServer({ port: Number(WS_PORT) })

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection established')
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Vigilant Security Protocol',
    timestamp: new Date().toISOString()
  }))
  
  ws.on('message', (message) => {
    console.log('📨 Received message:', message.toString())
  })
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed')
  })
})

console.log(`🌐 WebSocket Server running on port ${WS_PORT}`)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully')
  server.close(() => {
    console.log('✅ HTTP server closed')
    wss.close(() => {
      console.log('✅ WebSocket server closed')
      process.exit(0)
    })
  })
})

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully')
  server.close(() => {
    console.log('✅ HTTP server closed')
    wss.close(() => {
      console.log('✅ WebSocket server closed')
      process.exit(0)
    })
  })
})