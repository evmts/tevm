import { useState } from 'react'
import { createPublicClient, http } from 'viem'
import { SolEditor } from './SolEditor'

export function App() {
	const [result, setResult] = useState('Start the native TEVM server on port 8545, then connect.')
	return (
		<main>
			<h1>TEVM native example</h1>
			<button
				type="button"
				onClick={async () => {
					try {
						const client = createPublicClient({ transport: http('http://127.0.0.1:8545') })
						setResult(`Native engine head: ${await client.getBlockNumber()}`)
					} catch (error) {
						setResult(String(error))
					}
				}}
			>
				Read native block
			</button>
			<p>{result}</p>
			<SolEditor />
		</main>
	)
}
