// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ThreatDatabase {
    struct ThreatReport {
        address reporter;
        address maliciousContract;
        string threatType;
        uint256 timestamp;
        uint256 votes;
    }
    
    mapping(address => ThreatReport[]) public reports;
    mapping(address => bool) public isBlacklisted;
    mapping(address => uint256) public threatScore; // 0-100
    
    event ThreatReported(
        address indexed contract_,
        address indexed reporter,
        string threatType
    );
    
    event ContractBlacklisted(address indexed contract_);
    
    function reportThreat(
        address maliciousContract,
        string calldata threatType
    ) external {
        reports[maliciousContract].push(ThreatReport({
            reporter: msg.sender,
            maliciousContract: maliciousContract,
            threatType: threatType,
            timestamp: block.timestamp,
            votes: 1
        }));
        
        // Increase threat score
        threatScore[maliciousContract] += 10;
        
        // Auto-blacklist if score > 50
        if (threatScore[maliciousContract] > 50) {
            isBlacklisted[maliciousContract] = true;
            emit ContractBlacklisted(maliciousContract);
        }
        
        emit ThreatReported(maliciousContract, msg.sender, threatType);
    }
    
    function getThreatScore(address contract_) external view returns (uint256) {
        return threatScore[contract_];
    }
    
    function getReports(address contract_) external view returns (ThreatReport[] memory) {
        return reports[contract_];
    }
}