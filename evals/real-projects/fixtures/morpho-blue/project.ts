import { parseAbi } from 'viem'

export const addresses = {
  morpho: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
  adaptiveCurveIrm: '0x870ac11d48b15db9a138cf899d20f13f79ba00bc',
} as const

export const enabledLltv = 860000000000000000n

export const morphoAbi = parseAbi([
  'function owner() view returns (address)',
  'function isIrmEnabled(address irm) view returns (bool)',
  'function isLltvEnabled(uint256 lltv) view returns (bool)',
  'function nonce(address authorizer) view returns (uint256)',
  'function supply((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,uint256 shares,address onBehalf,bytes data) returns (uint256 assetsSupplied,uint256 sharesSupplied)',
  'function borrow((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,uint256 shares,address onBehalf,address receiver) returns (uint256 assetsBorrowed,uint256 sharesBorrowed)',
  'event Supply(bytes32 indexed id,address indexed caller,address indexed onBehalf,uint256 assets,uint256 shares)',
  'event Borrow(bytes32 indexed id,address caller,address indexed onBehalf,address indexed receiver,uint256 assets,uint256 shares)',
])
