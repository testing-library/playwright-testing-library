import {Fixtures} from '@playwright/test'

import type {Queries as ElementHandleQueries} from './element-handle'
import {queriesFixture as elementHandleQueriesFixture} from './element-handle'
import type {Queries as LocatorQueries} from './locator'
import {
  installTestingLibraryFixture,
  queriesFixture as locatorQueriesFixture,
  options,
  queriesFor,
  registerSelectorsFixture,
  withinFixture,
} from './locator'
import type {Config} from './types'
import {Within} from './types'

const elementHandleFixtures: Fixtures = {queries: elementHandleQueriesFixture}
const locatorFixtures: Fixtures = {
  queries: locatorQueriesFixture,
  within: withinFixture,
  registerSelectors: registerSelectorsFixture,
  installTestingLibrary: installTestingLibraryFixture,
  ...options,
}

interface ElementHandleFixtures {
  queries: ElementHandleQueries
}

interface LocatorFixtures extends Partial<Config> {
  queries: LocatorQueries
  within: Within
  registerSelectors: void
  installTestingLibrary: void
}

export {configure} from '..'

export type {ElementHandleFixtures as TestingLibraryFixtures, LocatorFixtures}
export {
  locatorFixtures,
  locatorQueriesFixture,
  elementHandleQueriesFixture as fixture,
  elementHandleFixtures as fixtures,
  queriesFor,
}
