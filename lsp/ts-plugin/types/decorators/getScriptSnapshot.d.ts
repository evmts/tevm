import type { Cache } from '@tevm/bundler-cache';
/**
 * Decorate `LangaugeServerHost.getScriptSnapshot` to return generated `.d.ts` file for `.sol` files
 * This will allow the language server to provide intellisense for `.sol` files
 * @see https://github.com/wagmi-dev/wagmi/blob/main/packages/cli/src/plugins/foundry.ts
 * TODO replace with modules for code reuse
 */
export declare const getScriptSnapshotDecorator: (solcCache: Cache) => import("../factories/decorator.js").HostDecorator;
