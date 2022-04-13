import * as path from 'path'

import * as playwright from '@playwright/test'

import {
  LocatorFixtures as TestingLibraryFixtures,
  locatorFixtures as fixtures,
  within,
} from '../../lib/fixture'

const test = playwright.test.extend<TestingLibraryFixtures>(fixtures)

const {expect} = test

test.describe('lib/fixture.ts (locators)', () => {
  test.beforeEach(async ({page}) => {
    await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)
  })

  test('should handle the query* methods', async ({queries: {queryByText}}) => {
    const locator = queryByText('Hello h1')

    expect(locator).toBeTruthy()
    expect(await locator.textContent()).toEqual('Hello h1')
  })

  test('should use the new v3 methods', async ({queries: {queryByRole}}) => {
    const locator = queryByRole('presentation')

    expect(locator).toBeTruthy()
    expect(await locator.textContent()).toContain('Layout table')
  })

  test('should handle regex matching', async ({queries: {queryByText}}) => {
    const locator = queryByText(/HeLlO h(1|7)/i)

    expect(locator).toBeTruthy()
    expect(await locator.textContent()).toEqual('Hello h1')
  })

  test('should handle the get* methods', async ({queries: {getByTestId}}) => {
    const locator = getByTestId('testid-text-input')

    expect(await locator.evaluate(el => el.outerHTML)).toMatch(
      `<input type="text" data-testid="testid-text-input">`,
    )
  })

  test('handles page navigations', async ({queries: {getByText}, page}) => {
    await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)

    const locator = getByText('Hello h1')

    expect(await locator.textContent()).toEqual('Hello h1')
  })

  test('should handle the get* method failures', async ({queries}) => {
    const {getByTitle} = queries
    // Use the scoped element so the pretty HTML snapshot is smaller

    await expect(async () => getByTitle('missing').textContent()).rejects.toThrow()
  })

  test('should handle the LabelText methods', async ({queries}) => {
    const {getByLabelText} = queries
    const locator = getByLabelText('Label A')

    /* istanbul ignore next */
    expect(await locator.evaluate(el => el.outerHTML)).toMatch(
      `<input id="label-text-input" type="text">`,
    )
  })

  test('should handle the queryAll* methods', async ({queries}) => {
    const {queryAllByText} = queries
    const locator = queryAllByText(/Hello/)

    expect(await locator.count()).toEqual(3)

    const text = await Promise.all([
      locator.nth(0).textContent(),
      locator.nth(1).textContent(),
      locator.nth(2).textContent(),
    ])

    expect(text).toEqual(['Hello h1', 'Hello h2', 'Hello h3'])
  })

  test('should handle the queryAll* methods with a selector', async ({queries}) => {
    const {queryAllByText} = queries
    const locator = queryAllByText(/Hello/, {selector: 'h2'})

    expect(await locator.count()).toEqual(1)

    expect(await locator.textContent()).toEqual('Hello h2')
  })

  test('should handle the getBy* methods with a selector', async ({queries}) => {
    const {getByText} = queries
    const locator = getByText(/Hello/, {selector: 'h2'})

    expect(await locator.textContent()).toEqual('Hello h2')
  })

  test('should handle the getBy* methods with a regex name', async ({queries}) => {
    const {getByRole} = queries
    const element = getByRole('button', {name: /getBy.*Test/})

    expect(await element.textContent()).toEqual('getByRole Test')
  })

  test('supports `hidden` option when querying by role', async ({queries: {queryAllByRole}}) => {
    const elements = queryAllByRole('img')
    const hiddenElements = queryAllByRole('img', {hidden: true})

    expect(await elements.count()).toEqual(1)
    expect(await hiddenElements.count()).toEqual(2)
  })

  test.describe('querying by role with `level` option', () => {
    test('retrieves the correct elements when querying all by role', async ({
      queries: {queryAllByRole},
    }) => {
      const locator = queryAllByRole('heading')
      const levelOneLocator = queryAllByRole('heading', {level: 3})

      expect(await locator.count()).toEqual(3)
      expect(await levelOneLocator.count()).toEqual(1)
    })

    test('does not throw when querying for a specific element', async ({queries: {getByRole}}) => {
      expect.assertions(1)

      await expect(getByRole('heading', {level: 3}).textContent()).resolves.not.toThrow()
    })
  })

  test('scopes to container with `within`', async ({queries: {queryByRole}}) => {
    const form = queryByRole('form', {name: 'User'})

    const {queryByLabelText} = within(form)

    const outerLocator = queryByLabelText('Name')
    const innerLocator = queryByLabelText('Username')

    expect(await outerLocator.count()).toBe(0)
    expect(await innerLocator.count()).toBe(1)
  })

  // TODO: configuration
  // TDOO: deferred page (do we need some alternative to `findBy*`?)
})
