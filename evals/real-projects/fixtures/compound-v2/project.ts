import { parseAbi } from 'viem'

export const addresses = {
  comptroller: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
  cUsdc: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
} as const

export const comptrollerAbi = parseAbi([
  'function oracle() view returns (address)',
  'function closeFactorMantissa() view returns (uint256)',
  'function markets(address cToken) view returns (bool isListed,uint256 collateralFactorMantissa,bool isComped)',
  'function enterMarkets(address[] cTokens) returns (uint256[])',
  'event MarketListed(address cToken)',
])

export const cTokenAbi = parseAbi([
  'function exchangeRateStored() view returns (uint256)',
  'function totalBorrows() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function mint(uint256 mintAmount) returns (uint256)',
  'function redeem(uint256 redeemTokens) returns (uint256)',
  'event Mint(address minter,uint256 mintAmount,uint256 mintTokens)',
  'event Redeem(address redeemer,uint256 redeemAmount,uint256 redeemTokens)',
])

