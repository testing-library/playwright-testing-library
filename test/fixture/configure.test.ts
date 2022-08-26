import * as path from 'path'

import * as playwright from '@playwright/test'

import {
  LocatorFixtures as TestingLibraryFixtures,
  locatorFixtures as fixtures,
} from '../../lib/fixture'

const test = playwright.test.extend<TestingLibraryFixtures>(fixtures)

const {expect} = test

test.use({testIdAttribute: 'data-new-id'})

test.describe('global configuration', () => {
  test.beforeEach(async ({page}) => {
    await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)
  })

  test('queries with test ID configured in module scope', async ({queries}) => {
    const defaultTestIdLocator = queries.queryByTestId('testid-text-input')
    const customTestIdLocator = queries.queryByTestId('first-level-header')

    await expect(defaultTestIdLocator).not.toBeVisible()
    await expect(customTestIdLocator).toBeVisible()
  })

  test.describe('overridding global configuration', () => {
    test.use({testIdAttribute: 'data-id'})

    test('overrides test ID configured in module scope', async ({queries}) => {
      const globalTestIdLocator = queries.queryByTestId('first-level-header')
      const overriddenTestIdLocator = queries.queryByTestId('second-level-header')

      await expect(globalTestIdLocator).not.toBeVisible()
      await expect(overriddenTestIdLocator).toBeVisible()
    })
  })

  test("page override doesn't modify global configuration", async ({queries}) => {
    const defaultTestIdLocator = queries.queryByTestId('testid-text-input')
    const customTestIdLocator = queries.queryByTestId('first-level-header')

    await expect(defaultTestIdLocator).not.toBeVisible()
    await expect(customTestIdLocator).toBeVisible()
  })
})
