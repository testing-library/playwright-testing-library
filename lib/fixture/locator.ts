import {promises as fs} from 'fs'

import type {Locator, PlaywrightTestArgs, TestFixture} from '@playwright/test'
import {selectors} from '@playwright/test'

import {queryNames as allQueryNames} from '../common'

import {replacer, reviver} from './helpers'
import type {
  AllQuery,
  FindQuery,
  LocatorQueries as Queries,
  Query,
  Selector,
  SelectorEngine,
  SupportedQuery,
} from './types'

const isAllQuery = (query: Query): query is AllQuery => query.includes('All')
const isNotFindQuery = (query: Query): query is Exclude<Query, FindQuery> =>
  !query.startsWith('find')

const queryNames = allQueryNames.filter(isNotFindQuery)

const queryToSelector = (query: SupportedQuery) =>
  query.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() as Selector

const queriesFixture: TestFixture<Queries, PlaywrightTestArgs> = async ({page}, use) => {
  const queries = queryNames.reduce(
    (rest, query) => ({
      ...rest,
      [query]: (...args: Parameters<Queries[keyof Queries]>) =>
        page.locator(`${queryToSelector(query)}=${JSON.stringify(args, replacer)}`),
    }),
    {} as Queries,
  )

  await use(queries)
}

const within = (locator: Locator): Queries =>
  queryNames.reduce(
    (rest, query) => ({
      ...rest,
      [query]: (...args: Parameters<Queries[keyof Queries]>) =>
        locator.locator(`${queryToSelector(query)}=${JSON.stringify(args, replacer)}`),
    }),
    {} as Queries,
  )

declare const queryName: SupportedQuery

const engine: () => SelectorEngine = () => ({
  query(root, selector) {
    const args = JSON.parse(selector, window.__testingLibraryReviver) as unknown as Parameters<
      Queries[typeof queryName]
    >

    if (isAllQuery(queryName))
      throw new Error(
        `PlaywrightTestingLibrary: the plural '${queryName}' was used to create this Locator`,
      )

    // @ts-expect-error
    const result = window.TestingLibraryDom[queryName](root, ...args)

    return result
  },
  queryAll(root, selector) {
    const testingLibrary = window.TestingLibraryDom
    const args = JSON.parse(selector, window.__testingLibraryReviver) as unknown as Parameters<
      Queries[typeof queryName]
    >

    // @ts-expect-error
    const result = testingLibrary[queryName](root, ...args)

    if (!result) return []

    return Array.isArray(result) ? result : [result]
  },
})

const registerSelectorsFixture: [
  TestFixture<void, PlaywrightTestArgs>,
  {scope: 'worker'; auto?: boolean},
] = [
  async ({}, use) => {
    try {
      await Promise.all(
        queryNames.map(async name =>
          selectors.register(
            queryToSelector(name),
            `(${engine.toString().replace(/queryName/g, `"${name}"`)})()`,
          ),
        ),
      )
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'PlaywrightTestingLibrary: failed to register Testing Library functions\n',
        error,
      )
    }
    await use()
  },
  {scope: 'worker', auto: true},
]

const installTestingLibraryFixture: [
  TestFixture<void, PlaywrightTestArgs>,
  {scope: 'test'; auto?: boolean},
] = [
  async ({context}, use) => {
    const testingLibraryDomUmdScript = await fs.readFile(
      require.resolve('@testing-library/dom/dist/@testing-library/dom.umd.js'),
      'utf8',
    )

    await context.addInitScript(`
        ${testingLibraryDomUmdScript}
        
        window.__testingLibraryReviver = ${reviver.toString()};
    `)

    await use()
  },
  {scope: 'test', auto: true},
]

export {queriesFixture, registerSelectorsFixture, installTestingLibraryFixture, within}
export type {Queries}
