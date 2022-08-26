import {promises as fs} from 'fs'

import {configureTestingLibraryScript} from '../../common'
import {reviver} from '../helpers'
import type {AllQuery, Config, FindQuery, Query, Selector, SupportedQuery} from '../types'

const isAllQuery = (query: Query): query is AllQuery => query.includes('All')
const isNotFindQuery = (query: Query): query is Exclude<Query, FindQuery> =>
  !query.startsWith('find')

const queryToSelector = (query: SupportedQuery) =>
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

export {isAllQuery, isNotFindQuery, queryToSelector, buildTestingLibraryScript}
