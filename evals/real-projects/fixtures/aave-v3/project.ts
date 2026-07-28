import { parseAbi } from 'viem'

export const addresses = {
  poolAddressesProvider: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
  pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  oracle: '0x54586bE62E3c3580375aE3723C145253060Ca0C2',
  weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
} as const

export const providerAbi = parseAbi([
  'function getPool() view returns (address)',
  'function getPriceOracle() view returns (address)',
  'event PoolUpdated(address indexed oldAddress, address indexed newAddress)',
  'event PriceOracleUpdated(address indexed oldAddress, address indexed newAddress)',
])

export const poolAbi = parseAbi([
  'function getReservesList() view returns (address[])',
  'function getUserAccountData(address user) view returns (uint256 totalCollateralBase,uint256 totalDebtBase,uint256 availableBorrowsBase,uint256 currentLiquidationThreshold,uint256 ltv,uint256 healthFactor)',
  'function supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)',
  'function borrow(address asset,uint256 amount,uint256 interestRateMode,uint16 referralCode,address onBehalfOf)',
  'event Supply(address indexed reserve,address user,address indexed onBehalfOf,uint256 amount,uint16 indexed referralCode)',
  'event Borrow(address indexed reserve,address user,address indexed onBehalfOf,uint256 amount,uint8 interestRateMode,uint256 borrowRate,uint16 indexed referralCode)',
])

