/**
 * Default compilation options
 * @type {import('./ValidatedCompileBaseOptions.js').ValidatedCompileBaseOptions & Omit<import('./ValidatedShadowOptions.js').ValidatedShadowOptions, 'sourceLanguage' | 'shadowLanguage' | 'injectIntoContractName'> & { loggingLevel: import('@tevm/logger').LogOptions['level'] }}
 */
export const defaults: import("./ValidatedCompileBaseOptions.js").ValidatedCompileBaseOptions & Omit<import("./ValidatedShadowOptions.js").ValidatedShadowOptions, "sourceLanguage" | "shadowLanguage" | "injectIntoContractName"> & {
    loggingLevel: import("@tevm/logger").LogOptions["level"];
};
//# sourceMappingURL=defaults.d.ts.map