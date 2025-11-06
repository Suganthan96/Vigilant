// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VigilantIntentCreator
 * @dev Creates transaction intents using Somnia Data Streams for real-time monitoring
 */
contract VigilantIntentCreator {
    
    // Intent tracking
    mapping(bytes32 => TransactionIntent) public intents;
    
    // Constants
    uint256 public constant VERIFICATION_FEE = 0.001 ether;
    uint256 public constant VERIFICATION_TIMEOUT = 60; // 60 seconds
    
    // Schema IDs for Somnia Data Streams
    bytes32 public immutable intentSchemaId;
    
    // Insurance pool
    uint256 public insurancePool;
    
    // Events
    event IntentCreated(
        bytes32 indexed intentId,
        address indexed user,
        address indexed target,
        bytes callData,
        uint256 value,
        uint64 deadline
    );
    
    // Structs
    struct TransactionIntent {
        address user;
        address target;
        bytes callData;
        uint256 value;
        uint64 timestamp;
        uint64 deadline;
        uint8 status; // 0=pending, 1=verifying, 2=approved, 3=blocked, 4=executed, 5=expired
        bytes32 stateSnapshot;
        bool exists;
    }
    
    // Status enum
    uint8 constant STATUS_PENDING = 0;
    uint8 constant STATUS_VERIFYING = 1;
    uint8 constant STATUS_APPROVED = 2;
    uint8 constant STATUS_BLOCKED = 3;
    uint8 constant STATUS_EXECUTED = 4;
    uint8 constant STATUS_EXPIRED = 5;
    
    constructor(bytes32 _intentSchemaId) {
        intentSchemaId = _intentSchemaId;
    }
    
    /**
     * @dev Create a new transaction intent
     * @param target The target contract address
     * @param callData The transaction call data
     * @param value The ETH value to transfer
     * @param deadline Timestamp when intent expires
     * @return intentId The unique identifier for this intent
     */
    function createIntent(
        address target,
        bytes calldata callData,
        uint256 value,
        uint64 deadline
    ) external payable returns (bytes32 intentId) {
        require(msg.value >= value + VERIFICATION_FEE, "Insufficient payment");
        require(deadline > block.timestamp, "Invalid deadline");
        require(deadline <= block.timestamp + VERIFICATION_TIMEOUT, "Deadline too far");
        require(target != address(0), "Invalid target");
        
        // Generate unique intent ID
        intentId = keccak256(abi.encodePacked(
            msg.sender,
            target,
            callData,
            value,
            block.timestamp,
            block.number,
            block.difficulty
        ));
        
        require(!intents[intentId].exists, "Intent already exists");
        
        // Capture state snapshot
        bytes32 stateSnapshot = _captureStateSnapshot(target);
        
        // Store intent
        intents[intentId] = TransactionIntent({
            user: msg.sender,
            target: target,
            callData: callData,
            value: value,
            timestamp: uint64(block.timestamp),
            deadline: deadline,
            status: STATUS_PENDING,
            stateSnapshot: stateSnapshot,
            exists: true
        });
        
        // Add verification fee to insurance pool
        insurancePool += VERIFICATION_FEE;
        
        // Emit blockchain event for Somnia Data Streams
        emit IntentCreated(intentId, msg.sender, target, callData, value, deadline);
        
        return intentId;
    }
    
    /**
     * @dev Capture state snapshot for monitoring
     */
    function _captureStateSnapshot(address target) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            target.balance,
            target.code.length,
            blockhash(block.number - 1),
            block.timestamp
        ));
    }
    
    /**
     * @dev Get intent details
     */
    function getIntent(bytes32 intentId) external view returns (
        address user,
        address target,
        bytes memory callData,
        uint256 value,
        uint64 timestamp,
        uint64 deadline,
        uint8 status,
        bytes32 stateSnapshot
    ) {
        TransactionIntent memory intent = intents[intentId];
        require(intent.exists, "Intent not found");
        
        return (
            intent.user,
            intent.target,
            intent.callData,
            intent.value,
            intent.timestamp,
            intent.deadline,
            intent.status,
            intent.stateSnapshot
        );
    }
}