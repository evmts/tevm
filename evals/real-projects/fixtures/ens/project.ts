import { parseAbi } from 'viem'

export const addresses = {
  registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
} as const

export const registryAbi = parseAbi([
  'function owner(bytes32 node) view returns (address)',
  'function resolver(bytes32 node) view returns (address)',
  'function ttl(bytes32 node) view returns (uint64)',
  'function setResolver(bytes32 node, address resolver)',
  'event Transfer(bytes32 indexed node, address owner)',
  'event NewResolver(bytes32 indexed node, address resolver)',
])

export const resolverAbi = parseAbi([
  'function addr(bytes32 node) view returns (address)',
  'function setAddr(bytes32 node, address addr)',
  'function text(bytes32 node, string key) view returns (string)',
  'event AddrChanged(bytes32 indexed node, address addr)',
])

