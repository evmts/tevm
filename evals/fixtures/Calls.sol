// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Callee {
    function double(uint256 value) external pure returns (uint256) {
        return value * 2;
    }
}

contract Caller {
    function callDouble(address callee, uint256 value) external view returns (uint256) {
        return Callee(callee).double(value);
    }
}
