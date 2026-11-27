import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './Store.js'

describe('CLI wizard Zustand store (useStore)', () => {
	beforeEach(() => {
		useStore.setState({
			name: '',
			currentStep: 0,
			path: '.',
			nameInput: '',
			framework: 'hardhat',
			useCase: 'ui',
			packageManager: 'npm',
			noGit: false,
			noInstall: false,
			currentPage: 'interactive',
			walletConnectProjectId: '',
		})
	})

	it('advances steps and updates selected fields via selectAndContinue', () => {
		useStore.getState().selectAndContinue({ name: 'framework', value: 'foundry' })
		expect(useStore.getState().framework).toBe('foundry')
		expect(useStore.getState().currentStep).toBe(1)
		expect(useStore.getState().currentPage).toBe('interactive')

		useStore.getState().selectAndContinue({ name: 'packageManager', value: 'pnpm', nextPage: true })
		expect(useStore.getState().packageManager).toBe('pnpm')
		expect(useStore.getState().currentStep).toBe(2)
		expect(useStore.getState().currentPage).toBe('creating')
	})

	it('decrements currentStep via goToPreviousStep and clamps at zero', () => {
		useStore.getState().goToPreviousStep({})
		expect(useStore.getState().currentStep).toBe(0)

		useStore.getState().selectAndContinue({ name: 'noGit', value: true })
		expect(useStore.getState().currentStep).toBe(1)

		useStore.getState().goToPreviousStep({})
		expect(useStore.getState().currentStep).toBe(0)
	})

	it('updates text inputs via setInput without mutating currentStep', () => {
		useStore.getState().setInput({ input: 'nameInput', value: 'my-tevm-app' })
		expect(useStore.getState().nameInput).toBe('my-tevm-app')
		expect(useStore.getState().currentStep).toBe(0)
	})
})
