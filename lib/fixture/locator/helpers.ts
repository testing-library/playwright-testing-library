import {promises as fs} from 'fs'

import type {Locator, Page} from '@playwright/test'
import {queries} from '@testing-library/dom'

import {configureTestingLibraryScript} from '../../common'
import {replacer, reviver} from '../helpers'
import type {
  AllQuery,
  Config,
  FindQuery,
  LocatorQueries as Queries,
  Query,
  Selector,
  SynchronousQuery,
} from '../types'

const allQueryNames = Object.keys(queries) as Query[]

const isAllQuery = (query: Query): query is AllQuery => query.includes('All')
const isNotFindQuery = (query: Query): query is Exclude<Query, FindQuery> =>
  !query.startsWith('find')

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

const queriesFor = (pageOrLocator: Page | Locator) =>
  synchronousQueryNames.reduce(
    (rest, query) => ({
      ...rest,
      [query]: (...args: Parameters<Queries[keyof Queries]>) =>
        pageOrLocator.locator(`${queryToSelector(query)}=${JSON.stringify(args, replacer)}`),
    }),
    {} as Queries,
  )

export {buildTestingLibraryScript, isAllQuery, queriesFor, queryToSelector, synchronousQueryNames}
