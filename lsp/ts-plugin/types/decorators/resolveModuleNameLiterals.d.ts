/**
 * Decorate `LangaugeServerHost.resolveModuleNameLiterals` to return config object to resolve `.sol` files
 * This tells the ts-server to resolve `.sol` files to `.d.ts` files with `getScriptSnapshot`
 */
export declare const resolveModuleNameLiteralsDecorator: import("../factories/decorator.js").HostDecorator;
