import {promises as fs} from 'fs'

import {configureTestingLibraryScript} from '../../common'
import {reviver} from '../helpers'
import type {Config, Selector, SynchronousQuery} from '../types'

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

export {buildTestingLibraryScript, queryToSelector}
