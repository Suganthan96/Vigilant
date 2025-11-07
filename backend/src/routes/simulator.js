import express from 'express';

const router = express.Router();

/**
 * Simulator API Routes
 * 
 * Provides endpoints for frontend to monitor verification progress
 */

/**
 * GET /api/simulator/status
 * Get overall simulator system status
 */
router.get('/status', (req, res) => {
    try {
        const simulatorManager = req.app.get('simulatorManager');
        
        if (!simulatorManager) {
            return res.status(503).json({
                error: 'Simulator system not initialized'
            });
        }

        const health = simulatorManager.getHealth();
        const metrics = simulatorManager.getMetrics();
        const simulators = simulatorManager.getSimulatorStatuses();

        res.json({
            health,
            metrics,
            simulators,
            timestamp: Date.now()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get simulator status',
            message: error.message
        });
    }
});

/**
 * GET /api/simulator/verification/:intentId
 * Get verification status for specific intent
 */
router.get('/verification/:intentId', (req, res) => {
    try {
        const { intentId } = req.params;
        const simulatorManager = req.app.get('simulatorManager');
        
        if (!simulatorManager) {
            return res.status(503).json({
                error: 'Simulator system not initialized'
            });
        }

        const status = simulatorManager.getVerificationStatus(intentId);
        
        res.json({
            intentId,
            ...status,
            timestamp: Date.now()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get verification status',
            message: error.message
        });
    }
});

/**
 * GET /api/simulator/active
 * Get all active verifications
 */
router.get('/active', (req, res) => {
    try {
        const simulatorManager = req.app.get('simulatorManager');
        
        if (!simulatorManager) {
            return res.status(503).json({
                error: 'Simulator system not initialized'
            });
        }

        const active = simulatorManager.getActiveVerifications();
        
        res.json({
            active,
            count: active.length,
            timestamp: Date.now()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get active verifications',
            message: error.message
        });
    }
});

/**
 * GET /api/simulator/recent
 * Get recent completed verifications
 */
router.get('/recent', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const simulatorManager = req.app.get('simulatorManager');
        
        if (!simulatorManager) {
            return res.status(503).json({
                error: 'Simulator system not initialized'
            });
        }

        const recent = simulatorManager.getRecentCompletions(limit);
        
        res.json({
            recent,
            count: recent.length,
            timestamp: Date.now()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get recent completions',
            message: error.message
        });
    }
});

/**
 * GET /api/simulator/metrics
 * Get detailed simulator metrics
 */
router.get('/metrics', (req, res) => {
    try {
        const simulatorManager = req.app.get('simulatorManager');
        
        if (!simulatorManager) {
            return res.status(503).json({
                error: 'Simulator system not initialized'
            });
        }

        const metrics = simulatorManager.getMetrics();
        
        res.json({
            ...metrics,
            timestamp: Date.now()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get metrics',
            message: error.message
        });
    }
});

/**
 * POST /api/simulator/restart/:simulatorId
 * Restart a specific simulator
 */
router.post('/restart/:simulatorId', async (req, res) => {
    try {
        const { simulatorId } = req.params;
        const simulatorManager = req.app.get('simulatorManager');
        
        if (!simulatorManager) {
            return res.status(503).json({
                error: 'Simulator system not initialized'
            });
        }

        await simulatorManager.restartSimulator(simulatorId);
        
        res.json({
            message: `Simulator ${simulatorId} restarted successfully`,
            timestamp: Date.now()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to restart simulator',
            message: error.message
        });
    }
});

/**
 * WebSocket endpoint for real-time updates
 */
router.ws = (wss) => {
    return (ws, req) => {
        console.log('📡 New WebSocket connection for simulator updates');
        
        const simulatorManager = req.app.get('simulatorManager');
        
        if (!simulatorManager) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Simulator system not initialized'
            }));
            ws.close();
            return;
        }

        // Send initial status
        ws.send(JSON.stringify({
            type: 'status',
            data: {
                health: simulatorManager.getHealth(),
                metrics: simulatorManager.getMetrics()
            }
        }));

        // Set up event listeners
        const onIntentReceived = (data) => {
            ws.send(JSON.stringify({
                type: 'intentReceived',
                data
            }));
        };

        const onIntentAnalyzed = (data) => {
            ws.send(JSON.stringify({
                type: 'intentAnalyzed',
                data
            }));
        };

        const onConsensusReached = (data) => {
            ws.send(JSON.stringify({
                type: 'consensusReached',
                data
            }));
        };

        const onAnalysisError = (data) => {
            ws.send(JSON.stringify({
                type: 'analysisError',
                data
            }));
        };

        // Register listeners
        simulatorManager.on('intentReceived', onIntentReceived);
        simulatorManager.on('intentAnalyzed', onIntentAnalyzed);
        simulatorManager.on('consensusReached', onConsensusReached);
        simulatorManager.on('analysisError', onAnalysisError);

        // Handle client messages
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                
                switch (data.type) {
                    case 'getStatus':
                        ws.send(JSON.stringify({
                            type: 'status',
                            data: {
                                health: simulatorManager.getHealth(),
                                metrics: simulatorManager.getMetrics()
                            }
                        }));
                        break;
                        
                    case 'getVerification':
                        if (data.intentId) {
                            const status = simulatorManager.getVerificationStatus(data.intentId);
                            ws.send(JSON.stringify({
                                type: 'verification',
                                data: status
                            }));
                        }
                        break;
                        
                    default:
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Unknown message type'
                        }));
                }
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });

        // Clean up on disconnect
        ws.on('close', () => {
            console.log('📡 WebSocket connection closed');
            simulatorManager.off('intentReceived', onIntentReceived);
            simulatorManager.off('intentAnalyzed', onIntentAnalyzed);
            simulatorManager.off('consensusReached', onConsensusReached);
            simulatorManager.off('analysisError', onAnalysisError);
        });

        // Send periodic status updates
        const statusInterval = setInterval(() => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({
                    type: 'statusUpdate',
                    data: {
                        health: simulatorManager.getHealth(),
                        active: simulatorManager.getActiveVerifications().length,
                        timestamp: Date.now()
                    }
                }));
            } else {
                clearInterval(statusInterval);
            }
        }, 5000); // Every 5 seconds
    };
};

export default router;