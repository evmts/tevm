import { createTsUpOptions } from '@tevm/tsupconfig'

export default createTsUpOptions({
	entry: ['src/index.js', 'src/cli.js'],
	exclude: ['**/*.spec.ts', '**/*.test.ts'],
})
