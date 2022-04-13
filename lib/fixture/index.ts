import {Fixtures} from '@playwright/test'

import {
  Queries as ElementHandleQueries,
  queriesFixture as elementHandleQueriesFixture,
} from './element-handle'

const elementHandleFixtures: Fixtures = {queries: elementHandleQueriesFixture}

interface ElementHandleFixtures {
  queries: ElementHandleQueries
}

export type {ElementHandleFixtures as TestingLibraryFixtures}
export {elementHandleQueriesFixture as fixture}
export {elementHandleFixtures as fixtures}

export {configure} from '..'
