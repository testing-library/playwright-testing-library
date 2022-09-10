import {Locator, Page} from '@playwright/test'
import type * as TestingLibraryDom from '@testing-library/dom'
import {queries} from '@testing-library/dom'

import type {Config as CommonConfig} from '../common'

import {reviver} from './helpers'
import type {LocatorPromise} from './locator'

/**
 * This type was copied across from Playwright
 *
 * @see {@link https://github.com/microsoft/playwright/blob/82ff85b106e31ffd7b3702aef260c9c460cfb10c/packages/playwright-core/src/client/types.ts#L108-L117}
 */
export type SelectorEngine = {
  /**
   * Returns the first element matching given selector in the root's subtree.
   */
  query(root: HTMLElement, selector: string): HTMLElement | null
  /**
   * Returns all elements matching given selector in the root's subtree.
   */
  queryAll(root: HTMLElement, selector: string): HTMLElement[]
}

type KebabCase<S> = S extends `${infer C}${infer T}`
  ? T extends Uncapitalize<T>
    ? `${Uncapitalize<C>}${KebabCase<T>}`
    : `${Uncapitalize<C>}-${KebabCase<T>}`
  : S

type Queries = typeof queries
type WaitForState = Exclude<Parameters<Locator['waitFor']>[0], undefined>['state']
type AsyncUtilExpectedState = Extract<WaitForState, 'visible' | 'attached'>

export type TestingLibraryLocator = Locator & {within: () => LocatorQueries}

type ConvertQuery<Query extends Queries[keyof Queries]> = Query extends (
  el: HTMLElement,
  ...rest: infer Rest
) => HTMLElement | (HTMLElement[] | null) | (HTMLElement | null)
  ? (...args: Rest) => TestingLibraryLocator
  : Query extends (
      el: HTMLElement,
      id: infer Id,
      options: infer Options,
      waitForOptions: infer WaitForOptions,
    ) => Promise<any>
  ? (
      id: Id,
      options?: Options,
      waitForOptions?: WaitForOptions & {state?: AsyncUtilExpectedState},
    ) => LocatorPromise
  : never

export type LocatorQueries = {[K in keyof Queries]: ConvertQuery<Queries[K]>}

type ConvertQueryDeferred<Query extends LocatorQueries[keyof LocatorQueries]> = Query extends (
  ...rest: infer Rest
) => any
  ? (...args: Rest) => LocatorPromise
  : never

export type DeferredLocatorQueries = {
  [K in keyof LocatorQueries]: ConvertQueryDeferred<LocatorQueries[K]>
}

export type WithinReturn<Root extends QueryRoot> = Root extends Page ? Screen : QueriesReturn<Root>
export type QueriesReturn<Root extends QueryRoot> = Root extends LocatorPromise
  ? DeferredLocatorQueries
  : LocatorQueries

export type QueryRoot = Page | Locator | LocatorPromise
export type Screen = LocatorQueries & Page
export type Within = <Root extends QueryRoot>(locator: Root) => WithinReturn<Root>

export type Query = keyof Queries
export type AllQuery = Extract<Query, `${string}All${string}`>
export type FindQuery = Extract<Query, `find${string}`>
export type GetQuery = Extract<Query, `get${string}`>
export type QueryQuery = Extract<Query, `query${string}`>
export type SynchronousQuery = Exclude<Query, FindQuery>

export type Selector = KebabCase<SynchronousQuery>

export interface Config extends CommonConfig {
  asyncUtilExpectedState: AsyncUtilExpectedState
}
export interface ConfigFn {
  (existingConfig: Config): Partial<Config>
}

export type ConfigDelta = ConfigFn | Partial<Config>
export type Configure = (configDelta: ConfigDelta) => void
export type ConfigureLocator = (configDelta: ConfigDelta) => Config

declare global {
  interface Window {
    TestingLibraryDom: typeof TestingLibraryDom
    __testingLibraryReviver: typeof reviver
  }
}
