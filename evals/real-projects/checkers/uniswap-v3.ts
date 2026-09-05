import assert from 'node:assert/strict'
import { addresses, factoryAbi, poolAbi, quoterAbi } from '../fixtures/uniswap-v3/project.js'
import { collector, equal, loadCase } from '../lib/check.js'

const results = collector('uniswap-v3')
const { client, factory } = await loadCase('createUniswapV3Sdk')
const sdk = await factory(client)
const fee = 3000
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
// Canonical WETH/USDC 0.3% pool from the pinned mainnet fixture.
const referencePool = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8'
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
await results.check('pool matches canonical WETH/USDC fixture', () => equal(actualPool.toLowerCase(), referencePool))
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
