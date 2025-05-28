// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract MockVNST {
    string public name = "Vietnam Stable Token";
    string public symbol = "VNST";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**18; // 1 million VNST
    
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
    
    // Mint function for testing (only for mock token)
    function mint(address to, uint256 amount) public {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    // Get free VNST for testing
    function getFreeVNST() public {
        uint256 freeAmount = 10000 * 10**18; // 10,000 VNST
        balanceOf[msg.sender] += freeAmount;
        totalSupply += freeAmount;
        emit Transfer(address(0), msg.sender, freeAmount);
    }
}
