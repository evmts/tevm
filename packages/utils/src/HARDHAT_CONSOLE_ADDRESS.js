/**
 * Hardhat's console precompile address: the ASCII bytes of `console.log` left-padded to 20 bytes.
 * Solidity `console.sol`/`console2.sol` send calldata here with STATICCALL.
 * @type {'0x000000000000000000636f6e736f6c652e6c6f67'}
 * @example
 * import { HARDHAT_CONSOLE_ADDRESS } from '@tevm/utils'
 * console.log(HARDHAT_CONSOLE_ADDRESS)
 */
export const HARDHAT_CONSOLE_ADDRESS = '0x000000000000000000636f6e736f6c652e6c6f67'
