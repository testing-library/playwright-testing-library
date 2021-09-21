import type {PlaywrightTestArgs, TestFixture} from '@playwright/test'
import type {IScopedQueryUtils} from './typedefs'
import {getDocument, getQueriesForElement} from '.'

const fixture: TestFixture<IScopedQueryUtils, PlaywrightTestArgs> = async ({page}, use) => {
  const document = await getDocument(page)

  const queries = getQueriesForElement(document)

  await use(queries)
}

export default fixture
