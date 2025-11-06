// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VigilantSimple {
    // ========== STRUCTS ==========
    
    struct TransactionIntent {
        address user;
        address target;
        bytes callData;
        uint256 value;
        uint256 timestamp;
        uint256 deadline;
        bool executed;
    }
    
    // ========== STATE VARIABLES ==========
    
    mapping(bytes32 => TransactionIntent) public intents;
    uint256 public constant VERIFICATION_FEE = 0.001 ether;
    
    // ========== EVENTS ==========
    
    event IntentSubmitted(
        bytes32 indexed intentId,
        address indexed user,
        address target,
        uint256 timestamp
    );
    
    event TransactionExecuted(
        bytes32 indexed intentId,
        bool success
    );
    
    // ========== INTENT SUBMISSION ==========
    
    function submitIntent(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable returns (bytes32) {
        require(msg.value >= value + VERIFICATION_FEE, "Insufficient payment");
        
        bytes32 intentId = keccak256(abi.encodePacked(
            msg.sender,
            target,
            data,
            block.timestamp,
            block.number
        ));
        
        intents[intentId] = TransactionIntent({
            user: msg.sender,
            target: target,
            callData: data,
            value: value,
            timestamp: block.timestamp,
            deadline: block.timestamp + 300, // 5 minute deadline
            executed: false
        });
        
        emit IntentSubmitted(intentId, msg.sender, target, block.timestamp);
        return intentId;
    }
    
    // ========== CONSENSUS (SIMPLIFIED) ==========
    
    function checkConsensus(bytes32 intentId) external view returns (bool) {
        TransactionIntent memory intent = intents[intentId];
        // Always return true for testing (simulate instant consensus)
        return intent.user != address(0) && !intent.executed;
    }
    
    // ========== EXECUTION ==========
    
    function executeIntent(bytes32 intentId) external {
        TransactionIntent storage intent = intents[intentId];
        
        require(msg.sender == intent.user, "Not authorized");
        require(!intent.executed, "Already executed");
        require(block.timestamp <= intent.deadline, "Expired");
        
        // Simplified consensus check
        require(checkConsensus(intentId), "No consensus");
        
        // Execute transaction
        intent.executed = true;
        
        (bool success, ) = intent.target.call{value: intent.value}(intent.callData);
        
        emit TransactionExecuted(intentId, success);
        
        require(success, "Execution failed");
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    function getIntent(bytes32 intentId) external view returns (TransactionIntent memory) {
        return intents[intentId];
    }
}