// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract MockvBTC {
    string public name = "Virtual Bitcoin Token";
    string public symbol = "vBTC";
    uint8 public decimals = 8; // Bitcoin has 8 decimals
    uint256 public totalSupply = 21000000 * 10**8; // 21 million vBTC (like BTC)
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        // Give initial supply to contract deployer
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // Get free vBTC for testing (0.1 vBTC = 10,000,000 units due to 8 decimals)
    function getFreevBTC() public {
        uint256 freeAmount = 10000000; // 0.1 vBTC
        balanceOf[msg.sender] += freeAmount;
        totalSupply += freeAmount;
        emit Transfer(address(0), msg.sender, freeAmount);
    }
    
    // Mint function for testing
    function mint(address to, uint256 amount) public {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
