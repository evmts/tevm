import type { FileAccessObject } from '@tevm/base-bundler';
import type { ResolvedCompilerConfig } from '@tevm/config';
import type typescript from 'typescript/lib/tsserverlibrary.js';
import type { Logger } from './logger.js';
/**
 * Represents a function that transforms a TypeScript LanguageServiceHost.
 *
 * A host decorator takes the original LanguageServiceHost from the TypeScript
 * language service and returns a modified version that alters or extends its behavior.
 * This is the primary mechanism used by this plugin to intercept and modify
 * TypeScript language service operations.
 *
 * @internal
 * @see {@link typescript.LanguageServiceHost}
 */
export type HostDecorator = (createInfo: typescript.server.PluginCreateInfo, ts: typeof typescript, logger: Logger, config: ResolvedCompilerConfig, fao: FileAccessObject) => typescript.LanguageServiceHost;
/**
 * Type of function passed into createDecorator
 * @see {@link createHostDecorator}
 * @example
 * const decoratorFn: PartialDecorator = (createInfo, ts, logger) => ({
 * getScriptKind: (fileName) => {
 *   if (fileName.endsWith('.sol')) {
 *     return ts.ScriptKind.TS
 *   }
 *   return createInfo.languageServiceHost.getScriptKind(fileName)
 *   },
 * })
 */
export type PartialHostDecorator = (createInfo: typescript.server.PluginCreateInfo, ts: typeof typescript, logger: Logger, config: ResolvedCompilerConfig, fao: FileAccessObject) => Partial<typescript.LanguageServiceHost>;
/**
 * Creates a full LanguageServiceHost decorator from a partial decorator function.
 *
 * This factory simplifies creating decorators by allowing you to specify only the
 * methods you want to override. The resulting decorator uses JavaScript Proxy to
 * intercept only the specified methods while delegating all other method calls
 * to the original LanguageServiceHost.
 *
 * @param decorator - A function that returns partial LanguageServiceHost implementation
 * @returns A complete HostDecorator function that can be used to decorate a LanguageServiceHost
 * @see {@link PartialHostDecorator}
 * @example
 * ```typescript
 * // Create a decorator that overrides the getScriptKind method
 * const jsonDecorator = createHostDecorator((createInfo, ts) => ({
 *   getScriptKind: (fileName) => {
 *     if (fileName.endsWith('.json')) {
 *       return ts.ScriptKind.JSON
 *     }
 *     return createInfo.languageServiceHost.getScriptKind(fileName)
 *   }
 * }))
 * ```
 */
export declare const createHostDecorator: (decorator: PartialHostDecorator) => HostDecorator;
/**
 * Composes multiple HostDecorator functions into a single decorator.
 *
 * This utility allows combining multiple independent decorators that each modify
 * different aspects of the TypeScript LanguageServiceHost. The decorators are
 * applied in the order they are provided (first to last).
 *
 * The composition works by chaining decorators, where each decorator receives
 * the result of applying all previous decorators.
 *
 * @param decorators - Array of HostDecorator functions to compose
 * @returns A single HostDecorator that applies all the provided decorators
 * @example
 * ```typescript
 * // Combine multiple decorators into one
 * const combinedDecorator = decorateHost(
 *   scriptKindDecorator,
 *   moduleResolverDecorator,
 *   scriptSnapshotDecorator
 * )
 *
 * // Apply all decorators at once
 * const decoratedHost = combinedDecorator(createInfo, typescript, logger, config, fao)
 * ```
 */
export declare const decorateHost: (...decorators: HostDecorator[]) => HostDecorator;
