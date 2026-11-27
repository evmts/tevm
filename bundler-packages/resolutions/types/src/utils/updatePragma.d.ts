export class NoPragmaFoundError extends Error {
    /**
     * @type {'NoPragmaFoundError'}
     */
    _tag: "NoPragmaFoundError";
    /**
     * @type {'NoPragmaFoundError'}
     * @override
     */
    override name: "NoPragmaFoundError";
}
export function updatePragma(solidityCode: string, version?: string): import("effect/Effect").Effect<string, NoPragmaFoundError, never>;
//# sourceMappingURL=updatePragma.d.ts.map