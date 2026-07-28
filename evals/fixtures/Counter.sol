// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public number;
    event ValueSet(uint256 value);
    error Unauthorized(address caller);

    constructor(uint256 initialValue) {
        number = initialValue;
    }

    function set(uint256 value) external {
        number = value;
        emit ValueSet(value);
    }

    function failWithReason() external pure {
        revert("blocked by eval");
    }

    function restricted() external view {
        if (msg.sender != address(0xBEEF)) {
            revert Unauthorized(msg.sender);
        }
    }
}
