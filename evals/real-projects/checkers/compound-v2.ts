import assert from 'node:assert/strict'
import { collector, equal, loadCase, VITALIK } from '../lib/check.js'
import { addresses, comptrollerAbi, cTokenAbi } from '../fixtures/compound-v2/project.js'

const results = collector('compound-v2')
const { client, factory } = await loadCase('createCompoundV2Sdk')
const sdk = await factory(client)
const [oracle, closeFactorMantissa, market, exchangeRateStored, totalBorrows, balance] =
  await Promise.all([
    client.readContract({
      address: addresses.comptroller, abi: comptrollerAbi, functionName: 'oracle',
    }),
    client.readContract({
      address: addresses.comptroller, abi: comptrollerAbi, functionName: 'closeFactorMantissa',
    }),
    client.readContract({
      address: addresses.comptroller,
      abi: comptrollerAbi,
      functionName: 'markets',
      args: [addresses.cUsdc],
    }),
    client.readContract({
      address: addresses.cUsdc, abi: cTokenAbi, functionName: 'exchangeRateStored',
    }),
    client.readContract({
      address: addresses.cUsdc, abi: cTokenAbi, functionName: 'totalBorrows',
    }),
    client.readContract({
      address: addresses.cUsdc, abi: cTokenAbi, functionName: 'balanceOf', args: [VITALIK],
    }),
  ])
const actual = await sdk.getMarketState(VITALIK)

await results.check('oracle matches pinned mainnet', () => equal(actual.oracle, oracle))
await results.check('close factor matches pinned mainnet', () => {
  equal(actual.closeFactorMantissa, closeFactorMantissa)
})
await results.check('market listing matches pinned mainnet', () => equal(actual.isListed, market[0]))
await results.check('collateral factor matches pinned mainnet', () => {
  equal(actual.collateralFactorMantissa, market[1])
})
await results.check('exchange rate matches pinned mainnet', () => {
  equal(actual.exchangeRateStored, exchangeRateStored)
})
await results.check('borrows and account balance match pinned mainnet', () => {
  equal(actual.totalBorrows, totalBorrows)
  equal(actual.balance, balance)
})
await results.check('money-market write and event surface is present', () => {
  assert.equal(sdk.prepareEnterMarkets([addresses.cUsdc]).functionName, 'enterMarkets')
  assert.equal(sdk.prepareMint(1_000_000n).functionName, 'mint')
  assert.equal(sdk.prepareRedeem(1n).functionName, 'redeem')
  assert.equal(typeof sdk.getMintEvents, 'function')
})
results.finish()

