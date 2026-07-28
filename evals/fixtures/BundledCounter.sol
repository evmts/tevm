// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BundledCounter {
    uint256 public number = 17;

    function set(uint256 value) external {
        number = value;
    }
}
