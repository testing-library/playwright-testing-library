import {readFileSync} from 'fs'
import * as path from 'path'
import {ElementHandle, JSHandle, Page} from 'playwright'
import waitForExpect from 'wait-for-expect'

import {ConfigureOptions, QueryMethods, ScopedQueryMethods} from './typedefs'
import {convertProxyToRegExp, mapArgument, convertRegExpToProxy} from './helpers'

const functionNames: ReadonlyArray<keyof QueryMethods> = [
  'queryByPlaceholderText',
  'queryAllByPlaceholderText',
  'getByPlaceholderText',
  'getAllByPlaceholderText',
  'findByPlaceholderText',
  'findAllByPlaceholderText',

  'queryByText',
  'queryAllByText',
  'getByText',
  'getAllByText',
  'findByText',
  'findAllByText',

  'queryByLabelText',
  'queryAllByLabelText',
  'getByLabelText',
  'getAllByLabelText',
  'findByLabelText',
  'findAllByLabelText',

  'queryByAltText',
  'queryAllByAltText',
  'getByAltText',
  'getAllByAltText',
  'findByAltText',
  'findAllByAltText',

  'queryByTestId',
  'queryAllByTestId',
  'getByTestId',
  'getAllByTestId',
  'findByTestId',
  'findAllByTestId',

  'queryByTitle',
  'queryAllByTitle',
  'getByTitle',
  'getAllByTitle',
  'findByTitle',
  'findAllByTitle',

  'queryByRole',
  'queryAllByRole',
  'getByRole',
  'getAllByRole',
  'findByRole',
  'findAllByRole',

  'queryByDisplayValue',
  'queryAllByDisplayValue',
  'getByDisplayValue',
  'getAllByDisplayValue',
  'findByDisplayValue',
  'findAllByDisplayValue',
] as const

const domLibraryAsString = readFileSync(
  path.join(__dirname, '../dom-testing-library.js'),
  'utf8',
).replace(/process.env/g, '{}')

const delegateFnBodyToExecuteInPageInitial = `
  ${domLibraryAsString};
  ${convertProxyToRegExp.toString()};

  const mappedArgs = args.map(${mapArgument.toString()});
  const moduleWithFns = fnName in __dom_testing_library__ ?
    __dom_testing_library__ :
    __dom_testing_library__.__moduleExports;
  return moduleWithFns[fnName](container, ...mappedArgs);
`

let delegateFnBodyToExecuteInPage = delegateFnBodyToExecuteInPageInitial

type DOMReturnType = ElementHandle | ElementHandle[] | null

type ContextFn = (...args: any[]) => ElementHandle

async function createElementHandle(handle: JSHandle): Promise<ElementHandle | null> {
  const element = handle.asElement()
  if (element) return element
  await handle.dispose()
  return null
}

async function createElementHandleArray(handle: JSHandle): Promise<ElementHandle[]> {
  const lengthHandle = await handle.getProperty('length')
  const length = (await lengthHandle.jsonValue()) as number

  const elements: ElementHandle[] = []

  /* eslint-disable no-plusplus, no-await-in-loop */
  for (let i = 0; i < length; i++) {
    const jsElement = await handle.getProperty(i.toString())
    const element = await createElementHandle(jsElement)
    if (element) elements.push(element)
  }
  /* eslint-enable no-plusplus, no-await-in-loop */

  return elements
}

async function covertToElementHandle(handle: JSHandle, asArray: boolean): Promise<DOMReturnType> {
  return asArray ? createElementHandleArray(handle) : createElementHandle(handle)
}

function processNodeText(handles: Handles<string>): Promise<string> {
  return handles.containerHandle.evaluate(handles.evaluateFn, ['getNodeText'])
}

async function processQuery(handles: Handles): Promise<DOMReturnType> {
  const {containerHandle, evaluateFn, fnName, argsToForward} = handles

  try {
    const handle = await containerHandle.evaluateHandle(evaluateFn, [fnName, ...argsToForward])
    return await covertToElementHandle(handle, fnName.includes('All'))
  } catch (error) {
    if (error instanceof Error) {
      error.message = error.message
        .replace(/^.*(?=TestingLibraryElementError:)/, '')
        .replace('[fnName]', `[${fnName}]`)

      error.stack = error.stack?.replace('[fnName]', `[${fnName}]`)
    }

    throw error
  }
}

interface Handles<T> {
  containerHandle: ElementHandle<T>
  evaluateFn: Function
  fnName: string
  argsToForward: any[]
}

const createDelegateFor = <T = DOMReturnType>(
  fnName: keyof QueryMethods,
  elementHandle: ElementHandle<T>,
): ((...args: any[]) => Promise<T>) =>
  async function delegate(...args: any[]): Promise<T> {
    // const containerHandle: ElementHandle = contextFn ? contextFn.apply(this, args) : this

    // // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
    // const evaluateFn = new Function('container, [fnName, ...args]', delegateFnBodyToExecuteInPage)

    // let argsToForward = args
    // // Remove the container from the argsToForward since it's always the first argument
    // if (containerHandle === args[0]) {
    //   argsToForward = argsToForward.slice(1)
    // }

    // // Convert RegExp to a special format since they don't serialize well
    // argsToForward = argsToForward.map(convertRegExpToProxy)

    // return processHandleFn!({fnName, containerHandle, evaluateFn, argsToForward})

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const evaluateFn = new Function('container, [fnName, ...args]', delegateFnBodyToExecuteInPage)

    try {
      const handle = await elementHandle.evaluateHandle(evaluateFn, [fnName, ...args])

      return await covertToElementHandle(handle, fnName.includes('All'))
    } catch (error) {
      if (error instanceof Error) {
        error.message = error.message
          .replace(/^.*(?=TestingLibraryElementError:)/, '')
          .replace('[fnName]', `[${fnName}]`)

        error.stack = error.stack?.replace('[fnName]', `[${fnName}]`)
      }

      throw error
    }
  }

export async function getDocument(_page?: Page): Promise<ElementHandle> {
  // @ts-ignore
  const page: Page = _page || this
  const documentHandle = await page.mainFrame().evaluateHandle('document')
  const document = documentHandle.asElement()
  if (!document) throw new Error('Could not find document')
  return document
}

type WaitForCallback = Parameters<typeof waitForExpect>[0]

export function wait(
  callback: WaitForCallback,
  {timeout = 4500, interval = 50}: {timeout?: number; interval?: number} = {},
): Promise<{}> {
  return waitForExpect(callback, timeout, interval)
}

export const waitFor = wait

export function configure(options: Partial<ConfigureOptions>): void {
  if (!options) {
    return
  }

  const {testIdAttribute} = options

  if (testIdAttribute) {
    delegateFnBodyToExecuteInPage = delegateFnBodyToExecuteInPageInitial.replace(
      /testIdAttribute: (['|"])data-testid(['|"])/g,
      `testIdAttribute: $1${testIdAttribute}$2`,
    )
  }
}

export const getQueriesForElement = <T>(element: ElementHandle<T>): ScopedQueryMethods => {
  const o = functionNames.reduce(
    (queries, queryName) => ({
      ...queries,
      [queryName]: createDelegateFor(queryName, element),
    }),
    {} as ScopedQueryMethods,
  )

  // functionNames.forEach(functionName => {
  //   o[functionName] = createDelegateFor<T>(functionName, contextFn)
  // })

  // o.getQueriesForElement = () => getQueriesForElement(o, () => o)
  // o.getNodeText = createDelegateFor<string>('getNodeText', contextFn, processNodeText)

  return o
}

export const within = getQueriesForElement

export const queries: QueryMethods = {}
getQueriesForElement(queries, el => el)
