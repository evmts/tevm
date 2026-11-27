/** Ethers provider over the native ZEVM JSON-RPC engine. */
export class TevmProvider extends JsonRpcApiProvider {
    /** @param {import('@tevm/memory-client').MemoryClientOptions} [options] */
    static createMemoryProvider(options?: import("@tevm/memory-client").MemoryClientOptions): Promise<TevmProvider>;
    /** @param {import('@tevm/memory-client').MemoryClient} client */
    constructor(client: import("@tevm/memory-client").MemoryClient);
    tevm: import("@tevm/memory-client").MemoryClient;
}
import { JsonRpcApiProvider } from 'ethers';
//# sourceMappingURL=TevmProvider.d.ts.map