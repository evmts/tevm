import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { collector, equal, loadCase } from '../lib/check.js'
import { addresses, factoryAbi, poolAbi, quoterAbi } from '../fixtures/uniswap-v3/project.js'

const require = createRequire(import.meta.url)
const { Token } = require('@uniswap/sdk-core')
const { computePoolAddress, FeeAmount } = require('@uniswap/v3-sdk')
const results = collector('uniswap-v3')
const { client, factory } = await loadCase('createUniswapV3Sdk')
const sdk = await factory(client)
const fee = FeeAmount.MEDIUM
const pool = await client.readContract({
  address: addresses.factory,
  abi: factoryAbi,
  functionName: 'getPool',
  args: [addresses.weth, addresses.usdc, fee],
})
const actualPool = await sdk.getPool(addresses.weth, addresses.usdc, fee)
const actual = await sdk.getPoolState(pool)
const [token0, token1, poolFee, liquidity, slot0] = await Promise.all([
  client.readContract({ address: pool, abi: poolAbi, functionName: 'token0' }),
  client.readContract({ address: pool, abi: poolAbi, functionName: 'token1' }),
  client.readContract({ address: pool, abi: poolAbi, functionName: 'fee' }),
  client.readContract({ address: pool, abi: poolAbi, functionName: 'liquidity' }),
  client.readContract({ address: pool, abi: poolAbi, functionName: 'slot0' }),
])
const incumbentPool = computePoolAddress({
  factoryAddress: addresses.factory,
  tokenA: new Token(1, addresses.weth, 18, 'WETH'),
  tokenB: new Token(1, addresses.usdc, 6, 'USDC'),
  fee,
})
const quoteParams = {
  tokenIn: addresses.weth,
  tokenOut: addresses.usdc,
  amountIn: 1_000_000_000_000_000_000n,
  fee,
  sqrtPriceLimitX96: 0n,
} as const
const quote = await client.readContract({
  address: addresses.quoterV2,
  abi: quoterAbi,
  functionName: 'quoteExactInputSingle',
  args: [quoteParams],
})
const actualQuote = await sdk.quoteExactInputSingle(quoteParams)

await results.check('factory pool matches pinned mainnet', () => equal(actualPool, pool))
await results.check('pool matches incumbent @uniswap/v3-sdk', () => equal(actualPool, incumbentPool))
await results.check('pool token pair matches pinned mainnet', () => {
  equal(actual.token0, token0)
  equal(actual.token1, token1)
})
await results.check('pool fee and liquidity match pinned mainnet', () => {
  equal(actual.fee, poolFee)
  equal(actual.liquidity, liquidity)
})
await results.check('slot0 price and tick match pinned mainnet', () => {
  equal(actual.sqrtPriceX96, slot0[0])
  equal(actual.tick, slot0[1])
})
await results.check('one WETH quote matches pinned mainnet', () => equal(actualQuote, quote[0]))
await results.check('write and event surface is present', () => {
  const request = sdk.prepareExactInputSingle({
    ...quoteParams,
    recipient: addresses.factory,
    amountOutMinimum: 0n,
  })
  assert.equal(request.functionName, 'exactInputSingle')
  assert.equal(typeof sdk.getSwapEvents, 'function')
})
results.finish()
