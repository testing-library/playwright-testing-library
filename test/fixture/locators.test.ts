import * as path from 'path'

import * as playwright from '@playwright/test'

import {
  LocatorFixtures as TestingLibraryFixtures,
  locatorFixtures as fixtures,
} from '../../lib/fixture'

const test = playwright.test.extend<TestingLibraryFixtures>(fixtures)

const {expect} = test

test.describe('lib/fixture.ts (locators)', () => {
  test.describe('standard page', () => {
    test.beforeEach(async ({page}) => {
      await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)
    })

    test.afterEach(async ({page}) => page.close())

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

    test.describe('function `TextMatch` argument', () => {
      test('supports function style `TextMatch`', async ({screen}) => {
        const locator = screen.getByText(
          // eslint-disable-next-line prefer-arrow-callback, func-names
          function (content, element) {
            return content.startsWith('Hello') && element?.tagName.toLowerCase() === 'h3'
          },
        )

        expect(locator).toBeTruthy()
        expect(await locator.textContent()).toEqual('Hello h3')
      })

      test('supports arrow function style `TextMatch`', async ({screen}) => {
        const locator = screen.getByText(
          (content, element) =>
            content.startsWith('Hello') && element?.tagName.toLowerCase() === 'h3',
        )

        expect(locator).toBeTruthy()
        expect(await locator.textContent()).toEqual('Hello h3')
      })

      test('allows local function references', async ({screen}) => {
        const locator = screen.getByText((content, element) => {
          const isMatch = (c: string, e: Element) =>
            c.startsWith('Hello') && e.tagName.toLowerCase() === 'h3'

          return element ? isMatch(content, element) : false
        })

        expect(locator).toBeTruthy()
        expect(await locator.textContent()).toEqual('Hello h3')
      })

      test('fails with helpful warning when function references closure scope', async ({
        screen,
      }) => {
        const isMatch = (c: string, e: Element) =>
          c.startsWith('Hello') && e.tagName.toLowerCase() === 'h3'

        const locator = screen.getByText((content, element) =>
          element ? isMatch(content, element) : false,
        )

        await expect(async () => locator.textContent()).rejects.toThrowError(
          expect.objectContaining({
            message: expect.stringContaining(
              'A ReferenceError was thrown when using a function TextMatch',
            ),
          }),
        )
      })
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

      test('does not throw when querying for a specific element', async ({
        queries: {getByRole},
      }) => {
        await expect(getByRole('heading', {level: 3}).textContent()).resolves.not.toThrow()
      })
    })

    test('scopes to container with `within`', async ({queries: {queryByRole}, within}) => {
      const form = queryByRole('form', {name: 'User'})

      const {queryByLabelText} = within(form)

      const outerLocator = queryByLabelText('Name')
      const innerLocator = queryByLabelText('Username')

      expect(await outerLocator.count()).toBe(0)
      expect(await innerLocator.count()).toBe(1)
    })

    test('when `Page` instance is provided, `within` returns a `Screen`', async ({
      page,
      within,
    }) => {
      const screen = within(page)

      await screen.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)

      const form = screen.queryByRole('form', {name: 'User'})

      const {queryByLabelText} = within(form)

      const outerLocator = queryByLabelText('Name')
      const innerLocator = queryByLabelText('Username')

      expect(await outerLocator.count()).toBe(0)
      expect(await innerLocator.count()).toBe(1)
    })

    test.describe('configuration', () => {
      test.describe('custom data-testid', () => {
        test.use({testIdAttribute: 'data-id'})

        test('supports custom data-testid attribute name', async ({queries}) => {
          const locator = queries.getByTestId('second-level-header')

          expect(await locator.textContent()).toEqual('Hello h2')
        })
      })

      test.describe('nested configuration', () => {
        test.use({testIdAttribute: 'data-new-id'})

        test('supports nested data-testid attribute names', async ({queries}) => {
          const locator = queries.getByTestId('first-level-header')

          expect(await locator.textContent()).toEqual('Hello h1')
        })
      })
    })

    test('screen fixture responds to Page and Query methods', async ({screen}) => {
      const locator = screen.getByRole('button', {name: /getBy.*Test/})
      expect(await locator.textContent()).toEqual('getByRole Test')

      await screen.goto(`file://${path.join(__dirname, '../fixtures/late-page.html')}`)

      const delayedLocator = await screen.findByText('Loaded!', undefined, {timeout: 3000})
      expect(await delayedLocator.textContent()).toEqual('Loaded!')
    })
  })

  test.describe('deferred page', () => {
    test.beforeEach(async ({page}) => {
      await page.goto(`file://${path.join(__dirname, '../fixtures/late-page.html')}`)
    })

    test.afterEach(async ({page}) => page.close())

    test('should handle the findBy* methods', async ({queries}) => {
      const locator = await queries.findByText('Loaded!', undefined, {timeout: 3000})

      expect(await locator.textContent()).toEqual('Loaded!')
    })

    test("queryBy* methods can be used with Playwright's laziness", async ({screen, within}) => {
      const modalLocator = await screen.findByRole('dialog', undefined, {timeout: 3000})

      await expect(modalLocator).toHaveText(/My Modal/)
      await within(modalLocator).getByRole('button', {name: 'Okay'}).click()

      await expect(screen.queryByRole('dialog')).toBeHidden()
    })

    test('should handle the findAllBy* methods', async ({queries}) => {
      const locator = await queries.findAllByText(/Hello/, undefined, {timeout: 3000})

      const text = await Promise.all([locator.nth(0).textContent(), locator.nth(1).textContent()])

      expect(text).toEqual(['Hello h1', 'Hello h2'])
    })

    test('throws Testing Library error when locator times out', async ({queries}) => {
      const query = async () => queries.findByText(/Loaded!/, undefined, {timeout: 500})

      await expect(query).rejects.toThrowError(
        expect.objectContaining({
          message: expect.stringContaining('TestingLibraryElementError'),
        }),
      )
    })

    test('throws Playwright error when locator times out for visible state (but is attached)', async ({
      queries,
    }) => {
      const query = async () =>
        queries.findByText(/Hidden/, undefined, {state: 'visible', timeout: 500})

      await expect(query).rejects.toThrowError(
        expect.objectContaining({
          message: expect.stringContaining('500'),
        }),
      )
    })

    test('throws Testing Library error when locator times out for attached state', async ({
      queries,
    }) => {
      const query = async () =>
        queries.findByText(/Loaded!/, undefined, {state: 'attached', timeout: 500})

      await expect(query).rejects.toThrowError(
        expect.objectContaining({
          message: expect.stringContaining('TestingLibraryElementError'),
        }),
      )
    })

    test('throws Testing Library error when multi-element locator times out', async ({queries}) => {
      const query = async () => queries.findAllByText(/Hello/, undefined, {timeout: 500})

      await expect(query).rejects.toThrowError(
        expect.objectContaining({
          message: expect.stringContaining('TestingLibraryElementError'),
        }),
      )
    })

    test.describe('configuring asynchronous queries via `use`', () => {
      test.use({asyncUtilTimeout: 3000})

      test('reads timeout configuration from `use` configuration', async ({queries, page}) => {
        // Ensure this test fails if we don't set `timeout` correctly in the `waitFor` in our find query
        page.setDefaultTimeout(4000)

        const locator = await queries.findByText('Loaded!')

        expect(await locator.textContent()).toEqual('Loaded!')
      })

      test.describe('with custom test ID attribute from `use`', () => {
        test.use({testIdAttribute: 'data-customid'})

        test('reads test ID configuration from `use` configuration', async ({queries, page}) => {
          // Ensure this test fails if we don't set `timeout` correctly in the `waitFor` in our find query
          page.setDefaultTimeout(4000)

          const locator = await queries.findByTestId('loaded')

          expect(await locator.textContent()).toEqual('Loaded!')
        })
      })
    })

    test('waits for hidden element to be visible when `visible` is passed for state', async ({
      queries,
    }) => {
      await expect(queries.getByText('Hidden')).toBeHidden()

      const locator = await queries.findByText('Hidden', undefined, {
        timeout: 3000,
        state: 'visible',
      })

      expect(await locator.textContent()).toEqual('Hidden')
    })

    test.describe('configuring asynchronous queries with `visible` state', () => {
      test.use({asyncUtilExpectedState: 'visible'})

      test('waits for hidden element to be visible', async ({queries}) => {
        await expect(queries.getByText('Hidden')).toBeHidden()

        const locator = await queries.findByText('Hidden', undefined, {timeout: 3000})

        expect(await locator.textContent()).toEqual('Hidden')
      })
    })

    test('waits for hidden element to be attached when `attached` is passed for state', async ({
      queries,
    }) => {
      await expect(queries.queryByText('Attached')).toHaveCount(0)

      const locator = await queries.findByText('Attached', undefined, {
        timeout: 3000,
        state: 'attached',
      })

      expect(await locator.textContent()).toEqual('Attached')
      await expect(locator).toBeHidden()
    })

    test.describe('configuring asynchronous queries with `attached` state', () => {
      test.use({asyncUtilExpectedState: 'attached'})

      test('waits for hidden element to be attached', async ({queries}) => {
        await expect(queries.queryByText('Attached')).toHaveCount(0)

        const locator = await queries.findByText('Attached', undefined, {timeout: 3000})

        expect(await locator.textContent()).toEqual('Attached')
        await expect(locator).toBeHidden()
      })
    })
  })

  test.describe('query chaining', () => {
    test.use({asyncUtilTimeout: 3000})

    test.beforeEach(async ({page}) => {
      await page.goto(`file://${path.join(__dirname, '../fixtures/chaining.html')}`)
    })

    test.afterEach(async ({page}) => page.close())

    test('chaining synchronous queries', async ({screen}) => {
      const locator = screen.getByRole('figure').within().getByText('Some image')

      expect(await locator.textContent()).toEqual('Some image')
    })

    test('chaining an asynchronous query onto a synchronous query', async ({screen}) => {
      const locator = await screen.getByRole('figure').within().findByRole('img')

      expect(await locator.getAttribute('alt')).toEqual('Some image')
    })

    test('chaining a synchronous query onto an asynchronous query', async ({screen}) => {
      const locator = await screen.findByRole('dialog').within().getByRole('textbox')

      expect(await locator.getAttribute('type')).toEqual('text')
    })

    test('chaining multiple synchronous queries onto an asynchronous query', async ({screen}) => {
      const locator = await screen
        .findByRole('dialog')
        .within()
        .getByTestId('image-container')
        .within()
        .getByRole('img')

      expect(await locator.getAttribute('alt')).toEqual('Some modal image')
    })

    test('chaining an asynchronous query between synchronous queries', async ({screen}) => {
      const locator = await screen
        .getByTestId('modal-container')
        .within()
        .findByRole('dialog')
        .within()
        .getByRole('img')

      expect(await locator.getAttribute('alt')).toEqual('Some modal image')
    })

    test('chaining multiple asynchronous queries', async ({screen}) => {
      const locator = await screen
        .findByRole('dialog')
        .within()
        .findByRole('button', {name: 'Close'})

      expect(await locator.textContent()).toEqual('Close')
    })

    test('chaining multiple asynchronous queries between synchronous queries', async ({screen}) => {
      const locator = await screen
        .getByTestId('modal-container')
        .within()
        .findByRole('dialog')
        .within()
        .findByRole('alert')
        .within()
        .getByRole('button', {name: 'Close'})

      expect(await locator.textContent()).toEqual('Close')
    })

    test.describe('configuring chained queries', () => {
      test.use({
        testIdAttribute: 'data-customid',
        asyncUtilTimeout: 1000,
        actionTimeout: 2000,
      })

      test('chained asynchronous queries inherit `asyncUtilTimeout`', async ({screen}) => {
        screen.setDefaultTimeout(3000)

        const query = async () => screen.getByRole('figure').within().findByRole('img')

        await expect(query).rejects.toThrowError(
          expect.objectContaining({
            message: expect.stringContaining('TestingLibraryElementError'),
          }),
        )
      })

      test('chained asynchronous queries inherit `testIdAttribute`', async ({screen}) => {
        const locator = await screen
          .getByRole('figure')
          .within()
          .findByTestId('some-image', undefined, {timeout: 3000})

        expect(await locator.getAttribute('alt')).toEqual('Some image')
      })

      test('subsequent chained asynchronous queries inherit `asyncUtilTimeout`', async ({
        screen,
      }) => {
        const query = async () =>
          screen
            .findByRole('dialog', undefined, {timeout: 3000}) // We want this one to succeed
            .within()
            .findByRole('button', {name: 'Close'}) // This should inherit the `1000` timeout and fail

        await expect(query).rejects.toThrowError(
          expect.objectContaining({
            message: expect.stringContaining('TestingLibraryElementError'),
          }),
        )
      })

      test('synchronous query with multiple chained asynchronous queries inherit `asyncUtilTimeout`', async ({
        screen,
      }) => {
        const query = async () =>
          screen
            .getByTestId('modal-container-custom-id')
            .within()
            .findByRole('dialog', undefined, {timeout: 3000}) // We want this one to succeed
            .within()
            .findByRole('button', {name: 'Close'}) // This should inherit the `1000` timeout and fail

        await expect(query).rejects.toThrowError(
          expect.objectContaining({
            message: expect.stringContaining('TestingLibraryElementError'),
          }),
        )
      })
    })
  })
})
