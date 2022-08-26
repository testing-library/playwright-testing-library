import type {Locator, Page, PlaywrightTestArgs, TestFixture} from '@playwright/test'
import {selectors} from '@playwright/test'

import {queryNames as allQueryNames} from '../../common'
import {replacer} from '../helpers'
import type {Config, LocatorQueries as Queries, SelectorEngine, SupportedQuery} from '../types'

import {buildTestingLibraryScript, isAllQuery, isNotFindQuery, queryToSelector} from './helpers'

const queryNames = allQueryNames.filter(isNotFindQuery)
const defaultConfig: Config = {testIdAttribute: 'data-testid', asyncUtilTimeout: 1000}

const options = Object.fromEntries(
  Object.entries(defaultConfig).map(([key, value]) => [key, [value, {option: true}] as const]),
)

const queriesFor = (pageOrLocator: Page | Locator) =>
  queryNames.reduce(
    (rest, query) => ({
      ...rest,
      [query]: (...args: Parameters<Queries[keyof Queries]>) =>
        pageOrLocator.locator(`${queryToSelector(query)}=${JSON.stringify(args, replacer)}`),
    }),
    {} as Queries,
  )

const queriesFixture: TestFixture<Queries, PlaywrightTestArgs> = async ({page}, use) =>
  use(queriesFor(page))

const within = (locator: Locator): Queries => queriesFor(locator)

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
  TestFixture<void, PlaywrightTestArgs & Config>,
  {scope: 'test'; auto?: boolean},
] = [
  async ({context, asyncUtilTimeout, testIdAttribute}, use) => {
    await context.addInitScript(
      await buildTestingLibraryScript({config: {asyncUtilTimeout, testIdAttribute}}),
    )

    await use()
  },
  {scope: 'test', auto: true},
]

export {installTestingLibraryFixture, options, queriesFixture, registerSelectorsFixture, within}
export type {Queries}
