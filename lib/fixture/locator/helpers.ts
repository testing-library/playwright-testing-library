import {promises as fs} from 'fs'

import type {Locator, Page} from '@playwright/test'
import {errors} from '@playwright/test'
import {queries} from '@testing-library/dom'

import {configureTestingLibraryScript} from '../../common'
import {replacer, reviver} from '../helpers'
import type {
  AllQuery,
  Config,
  FindQuery,
  GetQuery,
  LocatorQueries as Queries,
  Query,
  QueryQuery,
  Selector,
  SynchronousQuery,
} from '../types'

const allQueryNames = Object.keys(queries) as Query[]

const isAllQuery = (query: Query): query is AllQuery => query.includes('All')

const isFindQuery = (query: Query): query is FindQuery => query.startsWith('find')
const isNotFindQuery = (query: Query): query is Exclude<Query, FindQuery> =>
  !query.startsWith('find')

const findQueryToGetQuery = (query: FindQuery) => query.replace(/^find/, 'get') as GetQuery
const findQueryToQueryQuery = (query: FindQuery) => query.replace(/^find/, 'query') as QueryQuery

const queryToSelector = (query: SynchronousQuery) =>
  query.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() as Selector

const buildTestingLibraryScript = async ({config}: {config: Config}) => {
  const testingLibraryDom = await fs.readFile(
    require.resolve('@testing-library/dom/dist/@testing-library/dom.umd.js'),
    'utf8',
  )

  const configuredTestingLibraryDom = configureTestingLibraryScript(testingLibraryDom, config)

  return `
    ${configuredTestingLibraryDom}
    
    window.__testingLibraryReviver = ${reviver.toString()};
  `
}

const synchronousQueryNames = allQueryNames.filter(isNotFindQuery)

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

export {buildTestingLibraryScript, isAllQuery, queriesFor, queryToSelector, synchronousQueryNames}
