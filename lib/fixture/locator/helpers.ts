import {promises as fs} from 'fs'

import {configureTestingLibraryScript} from '../../common'
import {TestingLibraryDeserializedFunction, reviver} from '../helpers'
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
    ${TestingLibraryDeserializedFunction.toString()};
  `
}

/**
 * Alternative version of `Array.prototype.includes` that allows testing for
 * the existence of an item with a type that is a _superset_ of the type of the
 * items in the array.
 *
 * This allows us to use it to check whether an item of type `string` exists in
 * an array of string literals (e.g: `['foo', 'bar'] as const`) without TypeScript
 * complaining. It will, however, throw a compiler error if you try to pass an item
 * of type `number`.
 *
 * @example
 * const things = ['foo', 'bar'] as const;
 *
 * // error
 * const hasThing = (t: string) => things.includes(t);
 *
 * // compiles
 * const hasThing = (t: string) => includes(things, t);
 *
 * @param array array to search
 * @param item item to search for
 */
const includes = <T extends U, U>(array: ReadonlyArray<T>, item: U): item is T =>
  array.includes(item as T)

export {buildTestingLibraryScript, includes, queryToSelector}
