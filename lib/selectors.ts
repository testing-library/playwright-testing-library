/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {selectors} from '@playwright/test'

// playwright wants you to register each selector only once
// but I failed to make it work with both globalSetup or a worker fixture
// this is ugly, but it does the job!
let once = false

export async function registerSelectorEngines() {
  if (!once) {
    once = true

    // What's up with all the turtles? It's simply a regex for regexes.
    await Promise.all([
      selectors.register('ByPlaceholderText', () => ({
        queryAll(root: unknown, selector: string) {
          const turtle = /^\/(.+)\/([dumysig]*)/
          const matches = turtle.exec(selector)

          const match = matches !== null ? new RegExp(matches[1], matches[2]) : selector
          // @ts-ignore
          return __dom_testing_library__.__moduleExports.queryAllByPlaceholderText(root, match)
        },
      })),
      selectors.register('ByText', () => ({
        queryAll(root: unknown, selector: string) {
          const turtle = /^\/(.+)\/([dumysig]*)/
          const matches = turtle.exec(selector)

          const match = matches !== null ? new RegExp(matches[1], matches[2]) : selector
          // @ts-ignore
          return __dom_testing_library__.__moduleExports.queryAllByText(root, match)
        },
      })),
      selectors.register('ByLabelText', () => ({
        queryAll(root: unknown, selector: string) {
          const turtle = /^\/(.+)\/([dumysig]*)/
          const matches = turtle.exec(selector)

          const match = matches !== null ? new RegExp(matches[1], matches[2]) : selector
          // @ts-ignore
          return __dom_testing_library__.__moduleExports.queryAllByLabelText(root, match)
        },
      })),
      selectors.register('ByAltText', () => ({
        queryAll(root: unknown, selector: string) {
          const turtle = /^\/(.+)\/([dumysig]*)/
          const matches = turtle.exec(selector)

          const match = matches !== null ? new RegExp(matches[1], matches[2]) : selector
          // @ts-ignore
          return __dom_testing_library__.__moduleExports.queryAllByAltText(root, match)
        },
      })),
      selectors.register('ByTestId', () => ({
        queryAll(root: unknown, selector: string) {
          const turtle = /^\/(.+)\/([dumysig]*)/
          const matches = turtle.exec(selector)

          const match = matches !== null ? new RegExp(matches[1], matches[2]) : selector
          // @ts-ignore
          return __dom_testing_library__.__moduleExports.queryAllByTestId(root, match)
        },
      })),
      selectors.register('ByTitle', () => ({
        queryAll(root: unknown, selector: string) {
          const turtle = /^\/(.+)\/([dumysig]*)/
          const matches = turtle.exec(selector)

          const match = matches !== null ? new RegExp(matches[1], matches[2]) : selector
          // @ts-ignore
          return __dom_testing_library__.__moduleExports.queryAllByTitle(root, match)
        },
      })),
      selectors.register('ByRole', () => ({
        queryAll(root: unknown, selector: string) {
          const turtle = /^\/(.+)\/([dumysig]*)/
          const matches = turtle.exec(selector)

          const match = matches !== null ? new RegExp(matches[1], matches[2]) : selector
          // @ts-ignore
          return __dom_testing_library__.__moduleExports.queryAllByRole(root, match)
        },
      })),
      selectors.register('ByDisplayValue', () => ({
        queryAll(root: unknown, selector: string) {
          const turtle = /^\/(.+)\/([dumysig]*)/
          const matches = turtle.exec(selector)

          const match = matches !== null ? new RegExp(matches[1], matches[2]) : selector
          // @ts-ignore
          return __dom_testing_library__.__moduleExports.queryAllByDisplayValue(root, match)
        },
      })),
    ])
  }
}
