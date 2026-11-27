import type { SolcContractOutput } from '@tevm/solc';
import type { Abi } from 'abitype';
import type { CompilationOutputOption } from '../CompilationOutputOption.js';
export type CompiledSourceContractOutput<TOutputSelection extends readonly CompilationOutputOption[] | undefined = readonly CompilationOutputOption[] | undefined> = [
    TOutputSelection
] extends [readonly CompilationOutputOption[]] ? Extract<TOutputSelection[number], '*'> extends never ? // No '*', build output from selected fields
WithCompilationOutput<TOutputSelection, 'abi', {
    abi: Abi;
}> & WithCompilationOutput<TOutputSelection, 'metadata', {
    metadata: string;
}> & WithCompilationOutput<TOutputSelection, 'userdoc', {
    userdoc: SolcContractOutput['userdoc'];
}> & WithCompilationOutput<TOutputSelection, 'devdoc', {
    devdoc: SolcContractOutput['devdoc'];
}> & WithCompilationOutput<TOutputSelection, 'ir', {
    ir: string;
}> & WithCompilationOutput<TOutputSelection, 'storageLayout', {
    storageLayout: SolcContractOutput['storageLayout'];
}> & WithCompilationOutput<TOutputSelection, 'evm', {
    evm: SolcContractOutput['evm'];
}> & WithCompilationOutput<TOutputSelection, 'ewasm', {
    ewasm: SolcContractOutput['ewasm'];
}> : SolcContractOutput : {
    abi: Abi;
    evm: SolcContractOutput['evm'];
    storageLayout: SolcContractOutput['storageLayout'];
};
/**
 * Helper type to conditionally include an object in the output based on compilation output selection
 * Uses Extract to check if ANY member of the selection union matches the path (not if ALL members match)
 * @template TOutputSelection - The compilation output selection array
 * @template Path - The path to check in the selection (e.g., 'abi', 'evm', 'metadata')
 * @template Output - The object to include if the path is selected
 */
type WithCompilationOutput<TOutputSelection extends readonly string[], Path extends string, Output extends object> = Extract<TOutputSelection[number], Path | `${Path}.${string}`> extends never ? {} : Output;
export {};
//# sourceMappingURL=CompiledSourceContractOutput.d.ts.map