import {PlaywrightTestConfig} from '@playwright/test'

const config: PlaywrightTestConfig = {
  reporter: 'list',
  testDir: 'test/fixture',
  use: {actionTimeout: 3000},
  timeout: 5 * 1000,
}

export default config
