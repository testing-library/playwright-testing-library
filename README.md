> 😲 **Heads up** — Playwright introduced native Testing Library queries in version **[1.27](https://playwright.dev/docs/release-notes#locators)**.
>
> 💬 [**#558**](https://github.com/testing-library/playwright-testing-library/issues/558) ← We're discussing what this means for Playwright Testing Library in [this issue](https://github.com/testing-library/playwright-testing-library/issues/558). You can find a more detailed comparison of the new Playwright API and this library [here](https://github.com/testing-library/playwright-testing-library/issues/558#issuecomment-1273969028). Please ask any questions you may have or share thoughts and suggestions!

<br>

<div align="center">
  <br>
  <header>
    <img src="https://user-images.githubusercontent.com/288160/126050717-dd76eb80-ef06-40e0-97e8-72c20c9f8f20.png" height="64" />
  </header>
  <br>
  <h1>playwright-testing-library</h1>
  <p>🔍 Find elements in <strong>playwright</strong> like your users  with queries from <strong>@testing-library/dom</strong></p>
</div>

<div align="center">

[![Build Status][build-badge]][build-link]
[![Test Coverage][codecov-badge]][codecov-link]
[![Code Style][prettier-badge]][prettier-link]
[![Package Version][npm-badge]][npm-link] <br>
[![MIT License][license-badge]][license-link]
[![Conventional Commits][conventional-commits-badge]][conventional-commits-link]
[![Maintenance][maintenance-badge]][maintenance-link]

</div>

<br>

## 🎛 Features

All of your favorite user-centric querying functions from **@testing-library/react** and **@testing-library/dom** available from within Playwright!

- Test [fixture](https://playwright.dev/docs/test-fixtures) for **@playwright/test** via **@playwright-testing-library/test**
  - ✨ **New** — `Locator` queries fixture (`locatorFixtures`) [↓](#playwright-test-fixture)
  - `ElementHandle` queries fixture (`fixtures`) [↓](#legacy-playwright-test-fixture)
- Standalone queries for **playwright** via **playwright-testing-library**
  - `ElementHandle` queries (`getDocument` + `queries`) [↓](#standalone-playwright-queries)
  - Asynchronous `waitFor` assertion helper (via **[wait-for-expect](https://github.com/TheBrainFamily/wait-for-expect)**)

## 🌱 Installation

```bash
# For use with Playwright Test (@playwright/test)
npm install --save-dev @playwright-testing-library/test

# For use with Playwright (playwright)
npm install --save-dev playwright-testing-library
```

## 📝 Usage

There are currently a few different ways to use Playwright Testing Library, depending on how you use Playwright. However, the recommended approach is to use the `Locator` [queries fixture](#playwright-test-fixture) with Playwright Test (**@playwright/test**).

> ⚠️ The `ElementHandle` query APIs were created before Playwright introduced its `Locator` API and will be replaced in the next major version of Playwright Testing Library. If you can't use **@playwright/test** at the moment, you'll need to use the `ElementHandle` query API, but a migration path will be provided when we switch to the new `Locator` APIs.

### Playwright Test Fixture

> 🔖 Added in [**4.4.0**](https://github.com/testing-library/playwright-testing-library/releases/tag/v4.4.0)

Using the `Locator` Playwright Test (**@playwright/test**) fixture with **@playwright-testing-library/test**.

#### Setup

```ts
import {test as base} from '@playwright/test'
import {
  locatorFixtures as fixtures,
  LocatorFixtures as TestingLibraryFixtures,
} from '@playwright-testing-library/test/fixture'

const test = base.extend<TestingLibraryFixtures>(fixtures)

const {expect} = test

test('my form', async ({screen, within}) => {
  // Screen provides `Locator` queries scoped to current Playwright `Page`
  const formLocator = screen.getByTestId('my-form')

  // Scope queries to `Locator` with `within`
  // (note that this is a fixture from `test`, not the `within` import)
  const emailInputLocator = within(formLocator).getByLabelText('Email')

  // Interact via `Locator` API 🥳
  await emailInputLocator.fill('email@playwright.dev')
  await emailInputLocator.press('Enter')

  // Screen also provides Playwright's `Page` API
  screen.goto('/account')

  const emailLocator = screen.getByRole('heading', {level: 2})

  // Assert via `Locator` APIs 🎉
  await expect(emailLocator).toHaveText('email@playwright.dev')
})
```

#### Async Methods

The `findBy` queries work the same way as they do in [Testing Library](https://testing-library.com/docs/dom-testing-library/api-async) core in that they return `Promise<Locator>` and are intended to be used to defer test execution until an element appears on the page.

```ts
test('my modal', async ({screen, within}) => {
  // Here we wait for a modal to appear asynchronously before continuing
  // Note: the timeout for `findBy` queries is configured with `asyncUtilTimeout`
  const modalLocator = await screen.findByRole('dialog')

  // Once the modal is visible, we can interact with its contents and assert
  await expect(modalLocator).toHaveText(/My Modal/)
  await within(modalLocator).getByRole('button', {name: 'Okay'}).click()

  // We can also use `queryBy` methods to take advantage of Playwright's `Locator` auto-waiting
  // See: https://playwright.dev/docs/actionability
  // Note: this will use Playwright's timeout, not `asyncUtilTimeout`
  await expect(screen.queryByRole('dialog')).toBeHidden()
})
```

#### Chaining

> 🔖 Added in [**4.5.0**](https://github.com/testing-library/playwright-testing-library/releases/tag/v4.5.0)

As an alternative to the `within(locator: Locator)` function you're familiar with from Testing Library, Playwright Testing Library also supports chaining queries together.

All synchronous queries (`get*` + `query*`) return `Locator` instances augmented with a `.within()` method (`TestingLibraryLocator`). All asynchronous queries (`find*`) return a special `LocatorPromise` that also supports `.within()`. This makes it possible to chain queries, including chaining `get*`, `query*` and `find*` interchangeably.

> ⚠️ Note that including any `find*` query in the chain will make the entire chain asynchronous

##### Synchronous

```ts
test('chaining synchronous queries', async ({screen}) => {
  const locator = screen.getByRole('figure').within().findByRole('img')

  expect(await locator.getAttribute('alt')).toEqual('Some image')
})
```

##### Synchronous + Asynchronous

```ts
test('chaining synchronous queries + asynchronous queries', ({screen}) => {
  //              ↓↓↓↓↓ including any `find*` queries makes the whole chain asynchronous
  const locator = await screen
    .getByTestId('modal-container') // Get "modal container" or throw (sync)
    .within()
    .findByRole('dialog') // Wait for modal to appear (async, until `asyncUtilTimeout`)
    .within()
    .getByRole('button', {name: 'Close'}) // Get close button within modal (sync)

  expect(await locator.textContent()).toEqual('Close')
})
```

#### Configuration

The `Locator` query API is configured using Playwright's `use` API. See Playwright's documentation for [global](https://playwright.dev/docs/api/class-testconfig#test-config-use), [project](https://playwright.dev/docs/api/class-testproject#test-project-use), and [test](https://playwright.dev/docs/api/class-test#test-use).

##### Global

Configuring Testing Library globally in `playwright.config.ts`

```ts
import type {PlaywrightTestConfig} from '@playwright/test'

const config: PlaywrightTestConfig = {
  use: {
    // These are the defaults
    testIdAttribute: 'data-testid',
    asyncUtilTimeout: 1000,
    asyncUtilExpectedState: 'visible',
  },
}

export default config
```

##### Local

Scoping Testing Library configuration to test suites or `describe` blocks

```ts
import {test as base} from '@playwright/test'
import {
  locatorFixtures as fixtures,
  LocatorFixtures as TestingLibraryFixtures,
} from '@playwright-testing-library/test/fixture'

const test = base.extend<TestingLibraryFixtures>(fixtures)

const {describe, expect, use} = test

// Entire test suite
use({testIdAttribute: 'data-custom-test-id'})

describe(() => {
  // Specific block
  use({
    testIdAttribute: 'some-other-test-id',
    asyncUtilsTimeout: 5000,
    asyncUtilExpectedState: 'attached',
  })

  test('my form', async ({screen}) => {
    // ...
  })
})
```

### Legacy Playwright Test Fixture

Using the `ElementHandle` Playwright Test (**@playwright/test**) fixture with **@playwright-testing-library/test**.

> ⚠️ See note in [Usage](#-usage) as you should be using the `Locator` fixture if possible

#### Setup

```ts
import {test as base} from '@playwright/test'
import {fixtures, within, TestingLibraryFixtures} from '@playwright-testing-library/test/fixture'

const test = base.extend<TestingLibraryFixtures>(fixtures)

const {expect} = test

test('my form', async ({page, queries}) => {
  // Query methods are available in `test` blocks
  const formHandle = await queries.getByTestId('my-form')

  // Scope queries to an `ElementHandle` with `within`
  const emailInputHandle = await within(formHandle).getByLabelText('Email')

  // Interact via `ElementHandle` API
  await emailInputHandle.fill('email@playwright.dev')
  await emailInputHandle.press('Enter')

  page.goto('/account')

  const emailHandle = queries.getByRole('heading', {level: 2})

  // Assert via `ElementHandle` APIs
  expect(await emailHandle.textContent()).toEqual('email@playwright.dev')
})
```

#### Configuration

```ts
import {test as base} from '@playwright/test'
import {
  configure,
  fixtures,
  within,
  TestingLibraryFixtures,
} from '@playwright-testing-library/test/fixture'

const test = base.extend<TestingLibraryFixtures>(fixtures)

const {beforeEach, describe, expect} = test

// Global (these are the defaults)
configure({asyncUtilTimeout: 1000, testIdAttribute: 'data-testid'})

// Specific block
describe('my page', () => {
  beforeEach(() => configure({asyncUtilTimeout: 5000, testIdAttribute: 'data-custom-test-id'}))

  afterEach(() => configure({}))

  test('my form', async ({page, queries}) => {
    // ...
  })
})
```

### Standalone Playwright Queries

Using the `ElementHandle` queries with Playwright (**playwright**) and **playwright-testing-library**.

> ⚠️ See note in [Usage](#-usage) as you should be using **@playwright/test** with the `Locator` fixture if possible. The `Locator` queries will be made available for standalone **playwright** in the next major release.

```ts
import {beforeAll, expect, jest, test} from '@jest/globals'
import {webkit} from 'playwright' // or 'firefox' or 'chromium'
import {getDocument, queries, within} from 'playwright-testing-library'

let browser: playwright.Browser
let page: playwright.Page

beforeAll(() => {
  const browser = await webkit.launch()
  const page = await browser.newPage()
})

test('my form', () => {
  // Get `ElementHandle` for document from `Page`
  const documentHandle = await getDocument(page)

  // Global query methods take document handle as the first parameter
  const formHandle = await queries.getByTestId(documentHandle, 'my-form')

  // Scope queries to an `ElementHandle` with `within`
  const emailInputHandle = await within(formHandle).getByLabelText('Email')

  // Interact via `ElementHandle` API
  await emailInputHandle.fill('email@playwright.dev')
  await emailInputHandle.press('Enter')

  page.goto('/account')

  const accountHandle = getDocument(page)
  const emailHandle = queries.getByRole(accountHandle, 'heading', {level: 2})

  // Assert via `ElementHandle` APIs
  expect(await emailHandle.textContent()).toEqual('email@playwright.dev')
})
```

#### Configuration

```ts
import {beforeEach, afterEach, expect, jest, test} from '@jest/globals'
import {configure, getDocument, queries, within} from 'playwright-testing-library'

// Global (these are the defaults)
configure({asyncUtilTimeout: 1000, testIdAttribute: 'data-testid'})

// Specific block
describe('my page', () => {
  beforeEach(() => configure({asyncUtilTimeout: 5000, testIdAttribute: 'data-custom-test-id'}))

  afterEach(() => configure({}))

  test('my form', async ({page, queries}) => {
    // ...
  })
})
```

## 🔌 API

### Testing Library

All queries from **[@testing-library/dom](https://github.com/testing-library/dom-testing-library#usage)** are supported.

> 📝 The **`find*`** queries for the `Locator` queries return `Promise<Locator>` which resolves when the element is found before the timeout specified via `asyncUtilTimeout`

### Additional

Unique methods, not part of **@testing-library/dom**

> ⚠️ These only apply to the `ElementHandle` queries

- Get an `ElementHandle` for the document

  ```ts
  getDocument(page: playwright.Page): ElementHandle
  ```

- Wait for an assertion (wrapper around [wait-for-expect](https://github.com/TheBrainFamily/wait-for-expect))

  ```ts
  waitFor(
    expectation: () => void | Promise<void>,
    timeout?: number,
    interval?: number
  ): Promise<{}>
  ```

## Known Limitations

- Only `testIdAttribute` and `asyncUtilTimeout` are supported as configuration options
- Async utilities `waitForElement`, `waitForElementToBeRemoved` and `waitForDomChange` are not exposed. Consider using a `find*` query or a Playwright built-in like [`Locator.waitFor()`](https://playwright.dev/docs/api/class-locator#locator-wait-for).
- The `fireEvent` method is not exposed, use Playwright's built-ins instead.
- Assertion extensions from [**jest-dom**](https://testing-library.com/docs/ecosystem-jest-dom/) are not compatible, use Playwright Test if possible.

### Locator Queries

- The [`getNodeText()`](https://testing-library.com/docs/dom-testing-library/api-custom-queries/#getnodetext) function is currently unsupported.
- When using a function for [`TextMatch`](https://testing-library.com/docs/queries/about/#textmatch), the function cannot reference its closure scope

  ```ts
  // ✅ This is supported
  screen.getByText(content => content.startsWith('Foo'))

  // ❌ This is not supported
  const startsWithFoo = (content: string) => content.startsWith('Foo')

  screen.getByText(content => startsWithFoo(content))
  ```

## Special Thanks

- [pptr-testing-library](https://github.com/testing-library/pptr-testing-library)
- [@testing-library/dom](https://github.com/testing-library/dom-testing-library)

## Related Playwright Test Utilities

- [jest-playwright](https://github.com/playwright-community/jest-playwright)
- [expect-playwright](https://github.com/playwright-community/expect-playwright)

## LICENSE

MIT

## Maintenance

This project is actively maintained by engineers at
[@hoverinc](https://github.com/hoverinc/) 😀.

[codecov-badge]: https://codecov.io/gh/testing-library/playwright-testing-library/branch/main/graph/badge.svg
[codecov-link]: https://codecov.io/gh/testing-library/playwright-testing-library
[conventional-commits-badge]: https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg
[conventional-commits-link]: https://conventionalcommits.org
[david-badge]: https://david-dm.org/testing-library/playwright-testing-library.svg
[david-link]: https://david-dm.org/testing-library/playwright-testing-library
[license-badge]: https://img.shields.io/npm/l/@hover/javascript.svg
[license-link]: https://github.com/hoverinc/hover-javascript/blob/master/LICENSE
[maintenance-badge]: https://img.shields.io/badge/maintenance-active-247ddc?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAcCAYAAACUJBTQAAAB1ElEQVRIibWWPUtdQRCGH0VNF/wCCVjYCxr/gZWdhYVgLQYbm/wACTYxxA8SSBDtbKwUbfQWkiJFAgkkmHBBY6U2CXaCGlDDG1buxePOnt17bsgD28zOzjtnZvbuRVKR1SFpVdKepEe1njOGnOWCz0q60B1lSa05/oVE2iTNSfqdCZ7lSyWB0NmkSJekeUmXJqzlayWZUJxckUUTJs23mFAjlhNjSdMHfAQ6g54hZUnDdXyN44ek7iKNH4w0PMaeX7pQ8Ox6HQkWww3Dw1hPWoAJ4BxoB4aNR5oB4APQ5vekUdITSceZDLcreyORrGPcfpEL0CBpVNJRwLmUSWLS7NbGpju8FXEteT2qR+jQ9aS3QK2XgUljjXPpRC6iLpYV4KmxRghNVy28Aqb+t4jjLbBhrAH+RcRxZSwBUiINxlIHKZE/xlIHTTlHBDwHjoDPwHtgF/gEnBnvFJVfzSrXkpYyfxKGvIu14F3ONXP1LOWmzEPjpuWl92j55XyQyDnEjRN5AbwD9gMOPkV7tAPMOJE3ZuuOFmOpjS3gGfCdQDl8fgGnGVtzwt8F7wdGqgKOvOmq4iarB3gMjAFlb78qug5MAwehIO4tKViJe4wDP4FSrgfwF/ntR8JxRSf3AAAAAElFTkSuQmCC
[maintenance-link]: https://github.com/testing-library/playwright-testing-library#maintenance
[npm-badge]: https://img.shields.io/npm/v/playwright-testing-library
[npm-link]: https://www.npmjs.com/package/playwright-testing-library
[prettier-badge]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?logo=prettier
[prettier-link]: https://prettierjs.org/en/download/
[build-badge]: https://github.com/testing-library/playwright-testing-library/actions/workflows/build.yml/badge.svg
[build-link]: https://github.com/testing-library/playwright-testing-library/actions/workflows/build.yml
