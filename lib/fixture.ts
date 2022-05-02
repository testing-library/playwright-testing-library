import type {PlaywrightTestArgs, TestFixture} from '@playwright/test'

import {queryNames} from './common'
import type {FixtureQueries as Queries} from './typedefs'

import {getDocument, queries as unscopedQueries} from '.'

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

  queries.getNodeText = async e => unscopedQueries.getNodeText(e)

  await use(queries)
}

const fixtures = {queries: fixture}

export {configure} from '.'
export {fixture, fixtures}
export type {Queries, TestingLibraryFixtures}
