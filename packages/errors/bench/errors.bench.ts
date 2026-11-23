import { bench, describe } from 'vitest'
import { ExecutionError, InternalError, InvalidParamsError, RevertError, rpcErrorCodeToMessage } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

describe('@tevm/errors', () => {
	bench(
		'ExecutionError instantiation',
		() => {
			const err = new ExecutionError('out of gas', {
				docsPath: '/reference/tevm/errors',
			})
			if (!err.message) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'InvalidParamsError + InternalError with cause',
		() => {
			const cause = new Error('invalid hex')
			const e1 = new InvalidParamsError('invalid address', { cause })
			const e2 = new InternalError('internal failure', { cause: e1 })
			if (!e2.walk((e) => e === cause)) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'RevertError instantiation',
		() => {
			const err = new RevertError('ERC20: transfer amount exceeds balance')
			if (!err.message) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'rpcErrorCodeToMessage lookup',
		() => {
			const m1 = rpcErrorCodeToMessage[-32602]
			const m2 = rpcErrorCodeToMessage[-32000]
			const m3 = rpcErrorCodeToMessage[-32015]
			if (!m1 || !m2 || !m3) throw new Error('unexpected')
		},
		benchOpts,
	)
})
