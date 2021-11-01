/* eslint-disable jest/no-done-callback */

import * as path from 'path'
import baseTest from '@playwright/test'
import {mixinFixtures} from '../../lib/fixture'
import {registerSelectorEngines} from '../../lib/selectors'

const test = mixinFixtures(baseTest)

void registerSelectorEngines()

// eslint-disable-next-line @typescript-eslint/unbound-method
const {expect, beforeEach} = test

beforeEach(async ({page}) => {
  await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)
})

test('ByLabelText', async ({page}) => {
  const theInput = page.locator('ByLabelText=Label A')
  await theInput.type('abcdef')

  await expect(theInput).toHaveAttribute('type', 'text')
  await expect(theInput).toHaveValue('abcdef')

  await expect(page.locator('ByLabelText=Username')).toHaveAttribute('placeholder', 'Username')
  await expect(page.locator('ByLabelText=Password')).toHaveValue('hunter2')
})

test('ByLabelText - regex', async ({page}) => {
  const theInput = page.locator('ByLabelText=/lab/i')
  await theInput.type('abcdef')

  await expect(theInput).toHaveAttribute('type', 'text')
  await expect(theInput).toHaveValue('abcdef')
})

test('ByRole', async ({page}) => {
  await expect(page.locator('ByRole=button').nth(0)).toHaveText('getByRole Test')
  await expect(page.locator('ByRole=button').nth(1)).toHaveText('actually not a button')
})

test('ByPlaceholderText', async ({page}) => {
  await expect(page.locator('ByPlaceholderText=/username/i')).toHaveAttribute(
    'id',
    'username-input',
  )
})

test('form >> ByLabel', async ({page}) => {
  await expect(page.locator('form >> ByLabelText=/login/i')).toHaveText('Go!')
})

test('ByDisplayValue', async ({page}) => {
  await expect(page.locator('ByDisplayValue=/hunter\\d/')).toHaveAttribute(
    'aria-labelledby',
    'password-label',
  )
})

test('ByAltText', async ({page}) => {
  await expect(page.locator('ByAltText=/image/i')).toHaveAttribute('src', '')
})

test('ByTestId', async ({page}) => {
  await expect(page.locator('ByTestId=testid-text-input')).toHaveAttribute('type', 'text')
})

test('ByText', async ({page}) => {
  await expect(page.locator('ByText=/not a/i')).toHaveText('actually not a button')
})

test('>> visible', async ({page}) => {
  const onlyVisible = page.locator('ByText=/button/i >> visible=true')
  await expect(onlyVisible).toHaveCount(1)
  const all = page.locator('ByText=/button/i')
  await expect(all).toHaveCount(2)
})
