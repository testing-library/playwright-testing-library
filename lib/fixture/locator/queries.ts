import type {Locator, Page} from '@playwright/test'
import {errors} from '@playwright/test'
import {queries} from '@testing-library/dom'

import {replacer} from '../helpers'
import type {
  AllQuery,
  Config,
  FindQuery,
  GetQuery,
  LocatorQueries as Queries,
  Query,
  QueryQuery,
  SynchronousQuery,
} from '../types'

import {queryToSelector} from './helpers'

const isAllQuery = (query: Query): query is AllQuery => query.includes('All')

const isFindQuery = (query: Query): query is FindQuery => query.startsWith('find')
const isNotFindQuery = (query: Query): query is Exclude<Query, FindQuery> =>
  !query.startsWith('find')

const allQueryNames = Object.keys(queries) as Query[]
const synchronousQueryNames = allQueryNames.filter(isNotFindQuery)

const findQueryToGetQuery = (query: FindQuery) => query.replace(/^find/, 'get') as GetQuery
const findQueryToQueryQuery = (query: FindQuery) => query.replace(/^find/, 'query') as QueryQuery

const createFindQuery =
  (
    pageOrLocator: Page | Locator,
    query: FindQuery,
    {asyncUtilTimeout, asyncUtilExpectedState}: Partial<Config> = {},
  ) =>
  async (...[id, options, waitForElementOptions]: Parameters<Queries[FindQuery]>) => {
    const synchronousOptions = ([id, options] as const).filter(Boolean)

    const locator = pageOrLocator.locator(
      `${queryToSelector(findQueryToQueryQuery(query))}=${JSON.stringify(
        synchronousOptions,
        replacer,
      )}`,
    )

    const {state = asyncUtilExpectedState, timeout = asyncUtilTimeout} = waitForElementOptions ?? {}

    try {
      await locator.first().waitFor({state, timeout})
    } catch (error) {
      // In the case of a `waitFor` timeout from Playwright, we want to
      // surface the appropriate error from Testing Library, so run the
      // query one more time as `get*` knowing that it will fail with the
      // error that we want the user to see instead of the `TimeoutError`
      if (error instanceof errors.TimeoutError) {
        return pageOrLocator
          .locator(
            `${queryToSelector(findQueryToGetQuery(query))}=${JSON.stringify(
              synchronousOptions,
              replacer,
            )}`,
          )
          .first()
          .waitFor({state, timeout: 100})
      }

      throw error
    }

    return locator
  }

/**
 * Given a `Page` or `Locator` instance, return an object of Testing Library
 * query methods that return a `Locator` instance for the queried element
 *
 * @internal this API is not currently intended for public usage and may be
 * removed or changed outside of semantic release versioning. If possible, you
 * should use the `locatorFixtures` with **@playwright/test** instead.
 * @see {@link locatorFixtures}
 *
 * @param pageOrLocator `Page` or `Locator` instance to use as the query root
 * @param config Testing Library configuration to apply to queries
 *
 * @returns object containing scoped Testing Library query methods
 */
const queriesFor = (pageOrLocator: Page | Locator, config?: Partial<Config>) =>
  allQueryNames.reduce(
    (rest, query) => ({
      ...rest,
      [query]: isFindQuery(query)
        ? createFindQuery(pageOrLocator, query, config)
        : (...args: Parameters<Queries[SynchronousQuery]>) =>
            pageOrLocator.locator(`${queryToSelector(query)}=${JSON.stringify(args, replacer)}`),
    }),
    {} as Queries,
  )

export {allQueryNames, isAllQuery, isNotFindQuery, queriesFor, synchronousQueryNames}
