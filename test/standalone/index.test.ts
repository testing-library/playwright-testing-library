import * as path from 'path'
import * as playwright from 'playwright'
import {getDocument, queries, getQueriesForElement, waitFor, configure} from '../../lib'

describe('lib/index.ts', () => {
  let browser: playwright.Browser
  let page: playwright.Page

  beforeAll(async () => {
    browser = await playwright.firefox.launch()
    page = await browser.newPage()
    await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)
  })

  test('should handle the query* methods', async () => {
    const document = await getDocument(page)
    const element = await queries.queryByText(document, 'Hello h1')

    expect(element).toBeTruthy()
    expect(await element!.textContent()).toEqual('Hello h1')
  })

  test('should use the new v3 methods', async () => {
    const document = await getDocument(page)
    const element = await queries.queryByRole(document, 'presentation')

    expect(element).toBeTruthy()
    expect(await element!.textContent()).toContain('Layout table')
  })

  test('should handle regex matching', async () => {
    const document = await getDocument(page)
    const element = await queries.getByText(document, /HeLlO h(1|7)/i)

    expect(await element.textContent()).toEqual('Hello h1')
  })

  test('handles page navigations', async () => {
    await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)

    const element = await queries.getByText(await getDocument(page), 'Hello h1')

    expect(await element.textContent()).toEqual('Hello h1')
  })

  test('should handle the queryAll* methods', async () => {
    const document = await getDocument(page)
    const elements = await queries.queryAllByText(document, /Hello/)

    expect(elements).toHaveLength(3)

    const text = await Promise.all([
      page.evaluate(el => el.textContent, elements[0]),
      page.evaluate(el => el.textContent, elements[1]),
      page.evaluate(el => el.textContent, elements[2]),
    ])

    expect(text).toEqual(['Hello h1', 'Hello h2', 'Hello h3'])
  })

  test('should handle the queryAll* methods with a selector', async () => {
    const document = await getDocument(page)
    const elements = await queries.queryAllByText(document, /Hello/, {selector: 'h2'})

    expect(elements).toHaveLength(1)

    const text = await page.evaluate(el => el.textContent, elements[0])

    expect(text).toEqual('Hello h2')
  })

  test('should handle the getBy* methods with a selector', async () => {
    const document = await getDocument(page)
    const element = await queries.getByText(document, /Hello/, {selector: 'h2'})

    const text = await page.evaluate(el => el.textContent, element)

    expect(text).toEqual('Hello h2')
  })

  test('should handle the getBy* methods with a regex name', async () => {
    const document = await getDocument(page)
    const element = await queries.getByRole(document, 'button', {name: /getBy.*Test/})

    const text = await page.evaluate(el => el.textContent, element)

    expect(text).toEqual('getByRole Test')
  })

  test('supports `hidden` option when querying by role', async () => {
    const document = await getDocument(page)
    const elements = await queries.queryAllByRole(document, 'img')
    const hiddenElements = await queries.queryAllByRole(document, 'img', {hidden: true})

    expect(elements).toHaveLength(1)
    expect(hiddenElements).toHaveLength(2)
  })

  describe('querying by role with `level` option', () => {
    test('retrieves the correct elements when querying all by role', async () => {
      const document = await getDocument(page)
      const elements = await queries.queryAllByRole(document, 'heading')
      const levelOneElements = await queries.queryAllByRole(document, 'heading', {level: 3})

      expect(elements).toHaveLength(3)
      expect(levelOneElements).toHaveLength(1)
    })

    test('does not throw when querying for a specific element', async () => {
      expect.assertions(1)

      const document = await getDocument(page)

      await expect(queries.getByRole(document, 'heading', {level: 3})).resolves.not.toThrow()
    })
  })

  it('attaches `getNodeText`', async () => {
    const document = await getDocument(page)
    const element = await queries.getByText(document, 'Hello h1')

    expect(await queries.getNodeText(element)).toEqual('Hello h1')
  })

  describe('configuration', () => {
    afterEach(() => {
      configure({testIdAttribute: 'data-testid'}) // cleanup
    })

    it('should support custom data-testid attribute name', async () => {
      configure({testIdAttribute: 'data-id'})
      const document = await getDocument(page)
      const element = await queries.getByTestId(document, 'second-level-header')
      expect(await queries.getNodeText(element)).toEqual('Hello h2')
    })

    it('should support subsequent changing the data-testid attribute names', async () => {
      configure({testIdAttribute: 'data-id'})
      configure({testIdAttribute: 'data-new-id'})
      const document = await getDocument(page)
      const element = await queries.getByTestId(document, 'first-level-header')
      expect(await queries.getNodeText(element)).toEqual('Hello h1')
    })

    it.each([{}, undefined, null, {testIdAttribute: ''}])(
      'should keep the default data-testid when input passed is invalid (%s)',
      async options => {
        const document = await getDocument(page)
        configure(options as any)
        const element = await queries.getByTestId(document, 'testid-label')
        expect(await queries.getNodeText(element)).toEqual('Label A')
      },
    )
  })
  it('should support regex on raw queries object', async () => {
    const scope = await page.$('#scoped')
    if (!scope) throw new Error('Should have scope')
    const element = await queries.getByText(scope, /Hello/i)
    expect(await queries.getNodeText(element)).toEqual('Hello h3')
  })

  it('should bind getQueriesForElement', async () => {
    // FIXME: I think it will take some work to get the types in a
    // place to prevent @typescript-eslint from flagging this
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const {getByText} = getQueriesForElement(await getDocument(page))
    const element = await getByText('Hello h1')
    expect(await queries.getNodeText(element)).toEqual('Hello h1')
  })

  describe('loading the deferred page', () => {
    beforeEach(async () =>
      page.goto(`file://${path.join(__dirname, '../fixtures/late-page.html')}`),
    )

    it('should use `wait` properly', async () => {
      // FIXME: I think it will take some work to get the types in a
      // place to prevent @typescript-eslint from flagging this
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const {getByText} = getQueriesForElement(await getDocument(page))
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      await waitFor(async () => expect(await getByText('Loaded!')).toBeTruthy(), {timeout: 7000})
      expect(await getByText('Loaded!')).toBeTruthy()
    }, 9000)
  })

  afterAll(async () => {
    await browser.close()
  })
})
