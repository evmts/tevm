export class CreateRequireError extends Error {
    /**
     * @param {string} url
     * @param {object} [cause]
     * @param {unknown} [cause.cause]
     * @internal
     */
    constructor(url: string, options?: {});
    /**
     * @type {'CreateRequireError'}
     */
    _tag: "CreateRequireError";
}
export class RequireError extends Error {
    /**
     * @param {string} url
     * @param {object} [cause]
     * @param {unknown} [cause.cause]
     * @internal
     */
    constructor(url: string, options?: {});
    _tag: string;
}
export function createRequireEffect(url: string): import("effect/Effect").Effect<(id: string) => import("effect/Effect").Effect<ReturnType<NodeRequire>, RequireError, never>, CreateRequireError, never>;
//# sourceMappingURL=createRequireEffect.d.ts.map