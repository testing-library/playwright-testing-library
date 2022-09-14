import type {Locator, PlaywrightTestArgs, TestFixture} from '@playwright/test'
import {Page, selectors} from '@playwright/test'

import type {
  Config,
  LocatorQueries as Queries,
  Screen,
  SelectorEngine,
  SynchronousQuery,
  Within,
  WithinReturn,
} from '../types'

import {buildTestingLibraryScript, queryToSelector} from './helpers'
import {isAllQuery, queriesFor, screenFor, synchronousQueryNames} from './queries'

type TestArguments = PlaywrightTestArgs & Config

const defaultConfig: Config = {
  asyncUtilExpectedState: 'visible',
  asyncUtilTimeout: 1000,
  testIdAttribute: 'data-testid',
}

const options = Object.fromEntries(
  Object.entries(defaultConfig).map(([key, value]) => [key, [value, {option: true}] as const]),
)

const queriesFixture: TestFixture<Queries, TestArguments> = async (
  {page, asyncUtilExpectedState, asyncUtilTimeout},
  use,
) => use(queriesFor(page, {asyncUtilExpectedState, asyncUtilTimeout}))

const screenFixture: TestFixture<Screen, TestArguments> = async (
  {page, asyncUtilExpectedState, asyncUtilTimeout},
  use,
) => {
  const {proxy, revoke} = screenFor(page, {asyncUtilExpectedState, asyncUtilTimeout})

  await use(proxy)

  revoke()
}

const withinFixture: TestFixture<Within, TestArguments> = async (
  {asyncUtilExpectedState, asyncUtilTimeout},
  use,
) =>
  use(<Root extends Page | Locator>(root: Root) =>
    'goto' in root
      ? screenFor(root, {asyncUtilExpectedState, asyncUtilTimeout}).proxy
      : (queriesFor(root, {asyncUtilExpectedState, asyncUtilTimeout}) as WithinReturn<Root>),
  )

declare const queryName: SynchronousQuery

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
        synchronousQueryNames.map(async name =>
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
  TestFixture<void, TestArguments>,
  {scope: 'test'; auto?: boolean},
] = [
  async ({context, asyncUtilExpectedState, asyncUtilTimeout, testIdAttribute}, use) => {
    await context.addInitScript(
      await buildTestingLibraryScript({
        config: {asyncUtilExpectedState, asyncUtilTimeout, testIdAttribute},
      }),
    )

    await use()
  },
  {scope: 'test', auto: true},
]

export {
  installTestingLibraryFixture,
  options,
  queriesFixture,
  registerSelectorsFixture,
  screenFixture,
  withinFixture,
}
export type {Queries}
