import type {
  Fixtures,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestFixture,
  TestType,
} from '@playwright/test'
import {readFileSync} from 'fs'
import * as path from 'path'
import {getDocument, queries as unscopedQueries} from '.'
import {queryNames} from './common'
import type {ScopedQueries as Queries, ConfigurationOptions} from './typedefs'

let domLibraryAsString = readFileSync(
  path.join(__dirname, '../dom-testing-library.js'),
  'utf8',
).replace(/process.env/g, '{}')

interface TestingLibraryFixtures {
  queries: Queries
}

const fixture: TestFixture<Queries, PlaywrightTestArgs> = async ({page}, use) => {
  const queries = {} as Queries

  queryNames.forEach(name => {
    // @ts-expect-error
    queries[name] = async (...args) => {
      const document = await getDocument(page)

      // @ts-expect-error
      return unscopedQueries[name](document, ...args)
    }
  })

  await use(queries)
}

const fixtures = {queries: fixture}

const queryFixtures: Fixtures<
  TestingLibraryFixtures,
  {},
  PlaywrightTestArgs & PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
> = {
  page: async ({page}, use) => {
    await page.addInitScript(domLibraryAsString)

    await use(page)
  },
  queries: fixture,
}

/**
 * Call this before you mixin the fixtures if you don't use data-testid for as your TestId.
 * @param options alternative to data-testid
 */
export function configure(options: Partial<ConfigurationOptions>): void {
  if (!options) {
    return
  }

  const {testIdAttribute} = options

  if (testIdAttribute) {
    domLibraryAsString = domLibraryAsString.replace(
      /testIdAttribute: (['|"])data-testid(['|"])/g,
      `testIdAttribute: $1${testIdAttribute}$2`,
    )
  }
}

export function mixinFixtures<
  T extends PlaywrightTestArgs & PlaywrightTestOptions,
  W extends PlaywrightWorkerArgs & PlaywrightWorkerOptions,
>(base: TestType<T, W>): TestType<T & TestingLibraryFixtures, W> {
  return base.extend(queryFixtures)
}

export {fixture, fixtures}
export type {Queries, TestingLibraryFixtures}
