import * as path from 'path'
import * as playwright from '@playwright/test'

import {configure, fixtures, TestingLibraryFixtures} from '../../lib/fixture'
import {getDocument, within, getQueriesForElement} from '../../lib'

const test = playwright.test.extend<TestingLibraryFixtures>(fixtures)

const {expect} = test

test.describe('lib/fixture.ts', () => {
  test.beforeEach(async ({page}) => {
    await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)
  })

  test('should handle the query* methods', async ({queries: {queryByText}}) => {
    const element = await queryByText('Hello h1')

    expect(element).toBeTruthy()
    expect(await element.textContent()).toEqual('Hello h1')
  })

  test('should use the new v3 methods', async ({queries: {queryByRole}}) => {
    const element = await queryByRole('presentation')

    expect(element).toBeTruthy()
    expect(await element.textContent()).toContain('Layout table')
  })

  test('should handle regex matching', async ({queries: {queryByText}}) => {
    const element = await queryByText(/HeLlO h(1|7)/i)

    expect(element).toBeTruthy()
    expect(await element.textContent()).toEqual('Hello h1')
  })

  test('should handle the get* methods', async ({queries: {getByTestId}, page}) => {
    const element = await getByTestId('testid-text-input')

    expect(await page.evaluate(el => el.outerHTML, element)).toMatch(
      `<input type="text" data-testid="testid-text-input">`,
    )
  })

  test('attaches `getNodeText`', async ({queries}) => {
    const element = await queries.getByText('Hello h1')

    expect(await queries.getNodeText(element)).toEqual('Hello h1')
  })

  test('handles page navigations', async ({queries: {getByText}, page}) => {
    await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)

    const element = await getByText('Hello h1')

    expect(await element.textContent()).toEqual('Hello h1')
  })

  test('should handle the get* method failures', async ({queries}) => {
    const {getByTitle} = queries
    // Use the scoped element so the pretty HTML snapshot is smaller

    await expect(async () => getByTitle('missing')).rejects.toThrow()
  })

  test('should handle the LabelText methods', async ({queries, page}) => {
    const {getByLabelText} = queries
    const element = await getByLabelText('Label A')
    /* istanbul ignore next */
    expect(await page.evaluate(el => el.outerHTML, element)).toMatch(
      `<input id="label-text-input" type="text">`,
    )
  })

  test('should handle the queryAll* methods', async ({queries, page}) => {
    const {queryAllByText} = queries
    const elements = await queryAllByText(/Hello/)
    expect(elements).toHaveLength(3)

    const text = await Promise.all([
      page.evaluate(el => el.textContent, elements[0]),
      page.evaluate(el => el.textContent, elements[1]),
      page.evaluate(el => el.textContent, elements[2]),
    ])

    expect(text).toEqual(['Hello h1', 'Hello h2', 'Hello h3'])
  })

  test('should handle the queryAll* methods with a selector', async ({queries, page}) => {
    const {queryAllByText} = queries
    const elements = await queryAllByText(/Hello/, {selector: 'h2'})
    expect(elements).toHaveLength(1)

    const text = await page.evaluate(el => el.textContent, elements[0])

    expect(text).toEqual('Hello h2')
  })

  test('should handle the getBy* methods with a selector', async ({queries, page}) => {
    const {getByText} = queries
    const element = await getByText(/Hello/, {selector: 'h2'})

    const text = await page.evaluate(el => el.textContent, element)

    expect(text).toEqual('Hello h2')
  })

  test('should handle the getBy* methods with a regex name', async ({queries, page}) => {
    const {getByRole} = queries
    const element = await getByRole('button', {name: /getBy.*Test/})

    const text = await page.evaluate(el => el.textContent, element)

    expect(text).toEqual('getByRole Test')
  })

  test('supports `hidden` option when querying by role', async ({queries: {queryAllByRole}}) => {
    const elements = await queryAllByRole('img')
    const hiddenElements = await queryAllByRole('img', {hidden: true})

    expect(elements).toHaveLength(1)
    expect(hiddenElements).toHaveLength(2)
  })

  test.describe('querying by role with `level` option', () => {
    test('retrieves the correct elements when querying all by role', async ({
      queries: {queryAllByRole},
    }) => {
      const elements = await queryAllByRole('heading')
      const levelOneElements = await queryAllByRole('heading', {level: 3})

      expect(elements).toHaveLength(3)
      expect(levelOneElements).toHaveLength(1)
    })

    test('does not throw when querying for a specific element', async ({queries: {getByRole}}) => {
      expect.assertions(1)

      await expect(getByRole('heading', {level: 3})).resolves.not.toThrow()
    })
  })

  test('should get text content', async ({page}) => {
    const document = await getDocument(page)
    const $h3 = await document.$('#scoped h3')

    expect(await $h3.textContent()).toEqual('Hello h3')
  })

  test('scoping queries with `within`', async ({queries: {getByTestId}}) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const {queryByText} = within(await getByTestId('scoped'))

    expect(await queryByText('Hello h1')).toBeFalsy()
    expect(await queryByText('Hello h3')).toBeTruthy()
  })

  test('scoping queries with `getQueriesForElement`', async ({queries: {getByTestId}}) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const {queryByText} = getQueriesForElement(await getByTestId('scoped'))

    expect(await queryByText('Hello h1')).toBeFalsy()
    expect(await queryByText('Hello h3')).toBeTruthy()
  })

  test.describe('configuration', () => {
    test.afterEach(() => {
      configure({testIdAttribute: 'data-testid'}) // cleanup
    })

    test('should support custom data-testid attribute name', async ({queries}) => {
      configure({testIdAttribute: 'data-id'})

      const element = await queries.getByTestId('second-level-header')

      expect(await queries.getNodeText(element)).toEqual('Hello h2')
    })

    test('should support subsequent changing the data-testid attribute names', async ({
      queries,
    }) => {
      configure({testIdAttribute: 'data-id'})
      configure({testIdAttribute: 'data-new-id'})

      const element = await queries.getByTestId('first-level-header')

      expect(await queries.getNodeText(element)).toEqual('Hello h1')
    })
  })
  test.describe('deferred page', () => {
    test.beforeEach(async ({page}) => {
      await page.goto(`file://${path.join(__dirname, '../fixtures/late-page.html')}`)
    })

    test('should handle the findBy* methods', async ({queries}) => {
      const {findByText} = queries
      expect(await findByText('Loaded!', {}, {timeout: 7000})).toBeTruthy()
    })

    test('should handle the findByAll* methods', async ({queries}) => {
      const {findAllByText} = queries
      const elements = await findAllByText(/Hello/, {}, {timeout: 7000})
      expect(elements).toHaveLength(2)

      const text = await Promise.all([elements[0].textContent(), elements[1].textContent()])

      expect(text).toEqual(['Hello h1', 'Hello h2'])
    })
  })
})
