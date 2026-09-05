export function executeTool(name: string, input: unknown, sessions: ReturnType<(options?: {
    idleTtlMs?: number;
    maximumSessions?: number;
    now?: () => number;
}) => {
    createLocal: () => Promise<{
        handle: string;
        chainId: number;
        blockNumber: bigint;
        expiresAt: string;
    }>;
    createFork: (input: {
        url: string;
        blockNumber?: string;
        chain?: "auto" | "mainnet" | "optimism" | "base";
    }) => Promise<{
        handle: string;
        chainId: number;
        blockNumber: bigint;
        expiresAt: string;
    }>;
    get: (handle: string) => import("@tevm/memory-client").MemoryClient;
    close: (handle: string) => Promise<boolean>;
    size: () => number;
}>): Promise<unknown>;
//# sourceMappingURL=executeTool.d.ts.map