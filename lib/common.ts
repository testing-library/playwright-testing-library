import {Config as TestingLibraryConfig, queries} from '@testing-library/dom'

export type Config = Pick<TestingLibraryConfig, 'testIdAttribute' | 'asyncUtilTimeout'>

export const configureTestingLibraryScript = (
  script: string,
  {testIdAttribute, asyncUtilTimeout}: Partial<Config>,
) => {
  const withTestId = testIdAttribute
    ? script.replace(
        /testIdAttribute: (['|"])data-testid(['|"])/g,
        `testIdAttribute: $1${testIdAttribute}$2`,
      )
    : script

  return asyncUtilTimeout
    ? withTestId.replace(/asyncUtilTimeout: \d+/g, `asyncUtilTimeout: ${asyncUtilTimeout}`)
    : withTestId
}

export const queryNames: Array<keyof typeof queries> = [
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
]
