import { parseAbi } from 'viem'

export const addresses = {
  seaport: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
  conduitController: '0x00000000f9490004c11cef243f5400493c00ad63',
} as const

export const seaportAbi = parseAbi([
  'function information() view returns (string version,bytes32 domainSeparator,address conduitController)',
  'function getCounter(address offerer) view returns (uint256 counter)',
  'function getOrderHash((address offerer,address zone,(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount)[] offer,(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount,address recipient)[] consideration,uint8 orderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 conduitKey,uint256 counter) order) view returns (bytes32 orderHash)',
  'function incrementCounter() returns (uint256 newCounter)',
  'function validate(((address offerer,address zone,(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount)[] offer,(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount,address recipient)[] consideration,uint8 orderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 conduitKey,uint256 totalOriginalConsiderationItems) parameters,bytes signature)[] orders) returns (bool validated)',
  'event CounterIncremented(uint256 newCounter,address indexed offerer)',
  'event OrderFulfilled(bytes32 orderHash,address indexed offerer,address indexed zone,address recipient,(uint8 itemType,address token,uint256 identifier,uint256 amount)[] offer,(uint8 itemType,address token,uint256 identifier,uint256 amount,address recipient)[] consideration)',
])
