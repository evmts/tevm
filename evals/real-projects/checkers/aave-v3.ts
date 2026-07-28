import assert from 'node:assert/strict'
import { collector, equal, loadCase, VITALIK } from '../lib/check.js'
import { addresses, poolAbi, providerAbi } from '../fixtures/aave-v3/project.js'

const results = collector('aave-v3')
const { client, factory } = await loadCase('createAaveV3Sdk')
const sdk = await factory(client)
const [pool, oracle, reserves, account] = await Promise.all([
  client.readContract({
    address: addresses.poolAddressesProvider, abi: providerAbi, functionName: 'getPool',
  }),
  client.readContract({
    address: addresses.poolAddressesProvider, abi: providerAbi, functionName: 'getPriceOracle',
  }),
  client.readContract({
    address: addresses.pool, abi: poolAbi, functionName: 'getReservesList',
  }),
  client.readContract({
    address: addresses.pool, abi: poolAbi, functionName: 'getUserAccountData', args: [VITALIK],
  }),
])
const market = await sdk.getMarket()
const user = await sdk.getUserAccountData(VITALIK)

await results.check('provider pool matches pinned mainnet', () => equal(market.pool, pool))
await results.check('price oracle matches pinned mainnet', () => equal(market.oracle, oracle))
await results.check('reserve list matches pinned mainnet', () => equal(market.reserves, reserves))
await results.check('user account data matches pinned mainnet', () => {
  equal(Object.values(user), account)
})
await results.check('supply and borrow write surface is present', () => {
  assert.equal(sdk.prepareSupply(addresses.usdc, 1_000_000n, VITALIK, 0).functionName, 'supply')
  assert.equal(
    sdk.prepareBorrow(addresses.usdc, 1_000_000n, 2n, 0, VITALIK).functionName,
    'borrow',
  )
  assert.equal(typeof sdk.getSupplyEvents, 'function')
})
results.finish()

