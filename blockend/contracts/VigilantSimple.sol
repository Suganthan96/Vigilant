// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VigilantSimple
 * @dev Intent-based transaction protection against SST attacks
 * 
 * PROTECTION: Transaction Simulation Spoofing (SST)
 * - Captures state snapshot when intent created
 * - Verifies state unchanged before execution
 * - Two-transaction flow prevents simulation spoofing
 */
contract VigilantSimple {
    // ========== STRUCTS ==========
    
    struct TransactionIntent {
        address user;
        address target;
        bytes callData;
        uint256 value;
        uint256 timestamp;
        uint256 deadline;
        bytes32 stateSnapshot;  // 🛡️ SST Protection: State capture
        uint8 status;           // 0=pending, 1=approved, 2=blocked, 3=executed
        bool exists;
    }

    struct SimulationResult {
        address simulator;
        bool isRisky;
        uint256 riskScore;
        uint256 timestamp;
    }
    
    // ========== STATE VARIABLES ==========
    
    mapping(bytes32 => TransactionIntent) public intents;
    mapping(bytes32 => SimulationResult[]) public simulations;
    mapping(address => bool) public authorizedSimulators;
    
    uint256 public constant VERIFICATION_FEE = 0.001 ether;
    uint256 public constant MIN_SIMULATORS = 2;  // Simplified for testing
    
    // Status constants
    uint8 constant STATUS_PENDING = 0;
    uint8 constant STATUS_APPROVED = 1;
    uint8 constant STATUS_BLOCKED = 2;
    uint8 constant STATUS_EXECUTED = 3;
    
    // ========== EVENTS ==========
    
    event IntentSubmitted(
        bytes32 indexed intentId,
        address indexed user,
        address indexed target,
        bytes32 stateSnapshot,
        uint256 timestamp
    );

    event SimulationSubmitted(
        bytes32 indexed intentId,
        address indexed simulator,
        bool isRisky,
        uint256 riskScore
    );

    event StateChangeDetected(
        bytes32 indexed intentId,
        bytes32 oldStateHash,
        bytes32 newStateHash
    );

    event IntentApproved(
        bytes32 indexed intentId,
        uint256 avgRiskScore
    );

    event IntentBlocked(
        bytes32 indexed intentId,
        string reason
    );
    
    event IntentExecuted(
        bytes32 indexed intentId,
        bool success,
        bytes returnData
    );
    
    // ========== INTENT SUBMISSION ==========
    
    /**
     * @dev Submit transaction intent with state snapshot
     * 
     * IMPORTANT: This does NOT execute the target transaction!
     * It captures the current state and stores intent for verification.
     */
    function submitIntent(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable returns (bytes32) {
        require(msg.value >= value + VERIFICATION_FEE, "Insufficient payment");
        require(target != address(0), "Invalid target");
        
        bytes32 intentId = keccak256(abi.encodePacked(
            msg.sender,
            target,
            data,
            block.timestamp,
            block.number
        ));
        
        require(!intents[intentId].exists, "Intent already exists");
        
        // 🛡️ SST PROTECTION: Capture current state snapshot
        bytes32 stateSnapshot = captureStateSnapshot(target);
        
        intents[intentId] = TransactionIntent({
            user: msg.sender,
            target: target,
            callData: data,
            value: value,
            timestamp: block.timestamp,
            deadline: block.timestamp + 300, // 5 minute deadline
            stateSnapshot: stateSnapshot,
            status: STATUS_PENDING,
            exists: true
        });
        
        emit IntentSubmitted(intentId, msg.sender, target, stateSnapshot, block.timestamp);
        return intentId;
    }

    /**
     * @dev Capture state snapshot of target contract
     * 
     * This creates a fingerprint of the contract's current state
     * to detect if it changes before execution.
     */
    function captureStateSnapshot(address target) internal view returns (bytes32) {
        bytes memory stateData = abi.encodePacked(
            target.balance,
            target.code.length,
            blockhash(block.number - 1)
        );
        return keccak256(stateData);
    }
    
    // ========== SIMULATOR MANAGEMENT ==========

    /**
     * @dev Add authorized simulator (simplified - no staking for now)
     */
    function addSimulator(address simulator) external {
        // In production, this would have proper access control
        authorizedSimulators[simulator] = true;
    }

    /**
     * @dev Simulator submits analysis result
     */
    function submitSimulation(
        bytes32 intentId,
        bool isRisky,
        uint256 riskScore
    ) external {
        require(intents[intentId].exists, "Intent not found");
        require(authorizedSimulators[msg.sender], "Not authorized simulator");
        require(intents[intentId].status == STATUS_PENDING, "Wrong status");
        require(block.timestamp <= intents[intentId].deadline, "Intent expired");
        
        // Store simulation result
        simulations[intentId].push(SimulationResult({
            simulator: msg.sender,
            isRisky: isRisky,
            riskScore: riskScore,
            timestamp: block.timestamp
        }));
        
        emit SimulationSubmitted(intentId, msg.sender, isRisky, riskScore);
        
        // Check if we have enough simulations for consensus
        if (simulations[intentId].length >= MIN_SIMULATORS) {
            _checkAndUpdateConsensus(intentId);
        }
    }

    /**
     * @dev Internal function to check consensus and update status
     */
    function _checkAndUpdateConsensus(bytes32 intentId) internal {
        (bool hasConsensus, bool isSafe, uint256 avgRiskScore) = checkConsensus(intentId);
        
        if (!hasConsensus) {
            return; // Need more simulations
        }
        
        if (isSafe) {
            intents[intentId].status = STATUS_APPROVED;
            emit IntentApproved(intentId, avgRiskScore);
        } else {
            intents[intentId].status = STATUS_BLOCKED;
            emit IntentBlocked(intentId, "High risk detected");
            
            // Refund value to user (keep verification fee)
            if (intents[intentId].value > 0) {
                payable(intents[intentId].user).transfer(intents[intentId].value);
            }
        }
    }

    /**
     * @dev Check if simulators reached consensus
     */
    function checkConsensus(bytes32 intentId) public view returns (
        bool hasConsensus,
        bool isSafe,
        uint256 avgRiskScore
    ) {
        SimulationResult[] memory results = simulations[intentId];
        
        if (results.length < MIN_SIMULATORS) {
            return (false, false, 0);
        }
        
        // Calculate average risk score
        uint256 totalRiskScore = 0;
        uint256 riskyCount = 0;
        
        for (uint i = 0; i < results.length; i++) {
            totalRiskScore += results[i].riskScore;
            if (results[i].isRisky) {
                riskyCount++;
            }
        }
        
        avgRiskScore = totalRiskScore / results.length;
        
        // Consensus: Majority agree it's safe AND avg risk < 50
        hasConsensus = true;
        isSafe = (riskyCount == 0) && (avgRiskScore < 50);
        
        return (hasConsensus, isSafe, avgRiskScore);
    }
    
    // ========== STATE CHANGE DETECTION ==========

    /**
     * @dev Flag that contract state has changed
     * 
     * Called by monitoring system when state change detected.
     * This triggers re-simulation to prevent SST attacks.
     */
    function flagStateChange(bytes32 intentId) external {
        require(intents[intentId].exists, "Intent not found");
        require(
            intents[intentId].status == STATUS_PENDING ||
            intents[intentId].status == STATUS_APPROVED,
            "Wrong status"
        );
        
        bytes32 currentState = captureStateSnapshot(intents[intentId].target);
        
        if (currentState != intents[intentId].stateSnapshot) {
            // Reset to pending for re-simulation
            intents[intentId].status = STATUS_PENDING;
            
            // Clear old simulations
            delete simulations[intentId];
            
            emit StateChangeDetected(
                intentId,
                intents[intentId].stateSnapshot,
                currentState
            );
            
            // Update stored state snapshot
            intents[intentId].stateSnapshot = currentState;
        }
    }

    // ========== EXECUTION ==========
    
    /**
     * @dev Execute approved intent
     * 
     * THIS IS WHERE THE TARGET TRANSACTION ACTUALLY HAPPENS!
     * Includes final state verification to prevent SST attacks.
     */
    function executeIntent(bytes32 intentId) external returns (bool, bytes memory) {
        TransactionIntent storage intent = intents[intentId];
        
        require(intent.exists, "Intent not found");
        require(msg.sender == intent.user, "Not authorized");
        require(intent.status == STATUS_APPROVED, "Not approved");
        require(block.timestamp <= intent.deadline, "Intent expired");
        
        // 🛡️ SST PROTECTION: Final state check before execution
        bytes32 currentState = captureStateSnapshot(intent.target);
        require(
            currentState == intent.stateSnapshot,
            "State changed - re-simulation required"
        );
        
        // Mark as executed
        intent.status = STATUS_EXECUTED;
        
        // 🎯 EXECUTE THE ACTUAL TARGET TRANSACTION
        (bool success, bytes memory returnData) = intent.target.call{value: intent.value}(
            intent.callData
        );
        
        emit IntentExecuted(intentId, success, returnData);
        
        // Don't revert on target failure to prevent griefing
        return (success, returnData);
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    function getIntent(bytes32 intentId) external view returns (TransactionIntent memory) {
        require(intents[intentId].exists, "Intent not found");
        return intents[intentId];
    }

    function getSimulations(bytes32 intentId) external view returns (SimulationResult[] memory) {
        return simulations[intentId];
    }

    function isIntentApproved(bytes32 intentId) external view returns (bool) {
        return intents[intentId].exists &&
               intents[intentId].status == STATUS_APPROVED &&
               block.timestamp <= intents[intentId].deadline;
    }

    // ========== EMERGENCY FUNCTIONS ==========

    /**
     * @dev Cancel intent and refund value
     */
    function cancelIntent(bytes32 intentId) external {
        TransactionIntent storage intent = intents[intentId];
        
        require(intent.exists, "Intent not found");
        require(msg.sender == intent.user, "Not authorized");
        require(intent.status != STATUS_EXECUTED, "Already executed");
        
        intent.status = STATUS_BLOCKED;
        
        // Refund value (verification fee is non-refundable)
        if (intent.value > 0) {
            payable(msg.sender).transfer(intent.value);
        }
    }
}