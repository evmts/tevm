export function loadAbi({ address, client, explorerUrl, followProxies, etherscanApiKey }: {
    address: import("@tevm/utils").Address;
    client: import("viem").Client;
    explorerUrl: string | undefined;
    followProxies: boolean;
    etherscanApiKey: string | undefined;
}): ReturnType<typeof import("@shazow/whatsabi").autoload>;
//# sourceMappingURL=loadAbi.d.ts.map