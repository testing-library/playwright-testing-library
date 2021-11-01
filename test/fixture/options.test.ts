/* eslint-disable jest/no-done-callback */

import * as path from 'path'
import baseTest from '@playwright/test'
import {configure, mixinFixtures} from '../../lib/fixture'
import {registerSelectorEngines} from '../../lib/selectors'

configure({
  testIdAttribute: 'data-id',
})
const test = mixinFixtures(baseTest)

void registerSelectorEngines()

// eslint-disable-next-line @typescript-eslint/unbound-method
const {expect, beforeEach} = test

beforeEach(async ({page}) => {
  await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)
})

test('ByTestId', async ({page}) => {
  await expect(page.locator('ByTestId=second-level-header')).toHaveText('Hello h2')
})

test('getByTestId', async ({page, queries: {getByTestId}}) => {
  test.fixme()
  const element = await getByTestId('second-level-header')
  expect(await page.evaluate(el => el.outerHTML, element)).toMatch(
    `<h2 data-id="second-level-header">Hello h2</h2>`,
  )
})
