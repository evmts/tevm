// Ambient declarations for the Smithers build API used by WORKSPACE.ts and
// the PACKAGE.ts files. Those files are design-partner code: they define the
// API through usage, and the @smthrs packages are implemented afterwards to
// match. Every surface is therefore permissively typed; real types replace
// this file when the packages ship.
//
// WORKSPACE.ts and the PACKAGE.ts files are not part of any package build
// (each package tsconfig includes only its src/), so each pulls this file
// in with a `/// <reference path="./smithers.d.ts" />` directive.

/**
 * Any Smithers API surface: callable, and every property is another surface.
 * This types chains like `S.PackageManager.Pnpm({ manifest, lockfile })`,
 * `S.NodeModule.Bin("typescript", "tsc")`, and `evm.build` on an imported
 * Package without constraining the design.
 */
interface SmithersValue {
  (...args: unknown[]): SmithersValue
  [key: string]: SmithersValue
  /**
   * Smithers values follow Effect's yield* protocol, so `yield* S.Runtime`
   * works inside a generator body and produces another surface.
   */
  [Symbol.iterator](): Iterator<SmithersValue, SmithersValue, unknown>
}

/** The Smithers API entry point. Import as `import { Smithers as S }`. */
declare module "@smthrs/targets" {
  export const Smithers: SmithersValue
}

/**
 * Any other @smthrs package a PACKAGE.ts imports. Shorthand declaration, so
 * every import is typed `any`. PACKAGE.ts files import each other by
 * relative path, not a specifier.
 */
declare module "@smthrs/*"

/**
 * Smithers values are real Effect layers, composed with the real effect
 * modules (`import * as Layer from "effect/Layer"`). Permissively typed
 * until the packages ship.
 */
declare module "effect/*"
