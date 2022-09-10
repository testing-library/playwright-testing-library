import {Locator, errors} from '@playwright/test'
import {queries} from '@testing-library/dom'

import {replacer} from '../helpers'
import type {
  AllQuery,
  Config,
  DeferredLocatorQueries as DeferredQueries,
  FindQuery,
  GetQuery,
  LocatorQueries as Queries,
  Query,
  QueryQuery,
  QueryRoot,
  SynchronousQuery,
  TestingLibraryLocator,
} from '../types'

import {queryToSelector} from './helpers'

type QueriesReturn<Root extends QueryRoot> = Root extends LocatorPromise ? DeferredQueries : Queries
// type LocatorReturn<Root extends QueryRoot> = Locator & {within: () => QueriesReturn<Root>}

type SynchronousQueryParameters = Parameters<Queries[SynchronousQuery]>

const isAllQuery = (query: Query): query is AllQuery => query.includes('All')

const isFindQuery = (query: Query): query is FindQuery => query.startsWith('find')
const isNotFindQuery = (query: Query): query is Exclude<Query, FindQuery> =>
  !query.startsWith('find')

const allQueryNames = Object.keys(queries) as Query[]
const synchronousQueryNames = allQueryNames.filter(isNotFindQuery)

const findQueryToGetQuery = (query: FindQuery) => query.replace(/^find/, 'get') as GetQuery
const findQueryToQueryQuery = (query: FindQuery) => query.replace(/^find/, 'query') as QueryQuery

class LocatorPromise extends Promise<Locator> {
  /**
   * Wrap an `async` function `Promise` return value in a `LocatorPromise`.
   * This allows us to use `async/await` and still return a custom
   * `LocatorPromise` instance instead of `Promise`.
   *
   * @param fn
   * @returns
   */
  static wrap<A extends any[]>(fn: (...args: A) => Promise<Locator>) {
    return (...args: A) => LocatorPromise.from(fn(...args))
  }

  static from(promise: Promise<Locator>) {
    return new LocatorPromise((resolve, reject) => {
      promise.then(resolve).catch(reject)
    })
  }

  within() {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return queriesFor(this)
  }
}

const locatorFor = (
  root: Exclude<QueryRoot, Promise<any>>,
  query: SynchronousQuery,
  options: SynchronousQueryParameters,
) => root.locator(`${queryToSelector(query)}=${JSON.stringify(options, replacer)}`)

const augmentedLocatorFor = (...args: Parameters<typeof locatorFor>) => {
  const locator = locatorFor(...args)

  return new Proxy(locator, {
    get(target, property, receiver) {
      return property === 'within'
        ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
          () => queriesFor(target)
        : Reflect.get(target, property, receiver)
    },
  }) as TestingLibraryLocator
}

const createFindQuery = (
  root: QueryRoot,
  query: FindQuery,
  {asyncUtilTimeout, asyncUtilExpectedState}: Partial<Config> = {},
) =>
  LocatorPromise.wrap(
    async (...[id, options, waitForElementOptions]: Parameters<Queries[FindQuery]>) => {
      const settledRoot = root instanceof LocatorPromise ? await root : root
      const synchronousOptions = (options ? [id, options] : [id]) as SynchronousQueryParameters

      const locator = locatorFor(settledRoot, findQueryToQueryQuery(query), synchronousOptions)
      const {state: expectedState = asyncUtilExpectedState, timeout = asyncUtilTimeout} =
        waitForElementOptions ?? {}

      try {
        await locator.first().waitFor({state: expectedState, timeout})
      } catch (error) {
        // In the case of a `waitFor` timeout from Playwright, we want to
        // surface the appropriate error from Testing Library, so run the
        // query one more time as `get*` knowing that it will fail with the
        // error that we want the user to see instead of the `TimeoutError`
        if (error instanceof errors.TimeoutError) {
          const timeoutLocator = locatorFor(
            settledRoot,
            findQueryToGetQuery(query),
            synchronousOptions,
          ).first()

          // Handle case where element is attached, but hidden, and the expected
          // state is set to `visible`. In this case, dereferencing the
          // `Locator` instance won't throw a `get*` query error, so just
          // surface the original Playwright timeout error
          if (expectedState === 'visible' && !(await timeoutLocator.isVisible())) {
            throw error
          }

          // In all other cases, dereferencing the `Locator` instance here should
          // cause the above `get*` query to throw an error in Testing Library
          await timeoutLocator.waitFor({state: expectedState, timeout})
        }
      }

      return locator
    },
  )

/**
 * Given a `Page` or `Locator` instance, return an object of Testing Library
 * query methods that return a `Locator` instance for the queried element
 *
 * @internal this API is not currently intended for public usage and may be
 * removed or changed outside of semantic release versioning. If possible, you
 * should use the `locatorFixtures` with **@playwright/test** instead.
 * @see {@link locatorFixtures}
 *
 * @param root `Page` or `Locator` instance to use as the query root
 * @param config Testing Library configuration to apply to queries
 *
 * @returns object containing scoped Testing Library query methods
 */
const queriesFor = <Root extends QueryRoot>(
  root: Root,
  config?: Partial<Config>,
): QueriesReturn<Root> =>
  allQueryNames.reduce(
    (rest, query) => ({
      ...rest,
      [query]: isFindQuery(query)
        ? createFindQuery(root, query, config)
        : (...options: SynchronousQueryParameters) =>
            root instanceof LocatorPromise
              ? root.then(r => locatorFor(r, query, options))
              : augmentedLocatorFor(root, query, options),
    }),
    {} as QueriesReturn<Root>,
  )

export {
  allQueryNames,
  createFindQuery,
  isAllQuery,
  isFindQuery,
  isNotFindQuery,
  queriesFor,
  synchronousQueryNames,
  LocatorPromise,
}
