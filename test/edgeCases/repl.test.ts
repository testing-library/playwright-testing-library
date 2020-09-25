import './types.d'
import * as path from 'path'
import * as playwright from 'playwright'
import * as repl from 'repl'
import * as stream from 'stream'

import {addAwaitOutsideToReplServer} from 'await-outside'

import {configure, queries} from '../../lib'

describe('edge case', () => {
  let browser: playwright.Browser
  let page: playwright.Page

  beforeAll(async () => {
    browser = await playwright.chromium.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
    page = await browser.newPage()
    await page.goto(`file://${path.join(__dirname, '../fixtures/page.html')}`)
  })

  const inputStream = new stream.Readable()
  // eslint-disable-next-line
  inputStream._read = () => {}

  let outputStr = ''
  const through = new stream.PassThrough()
  const outputStream = new stream.Writable()
  // eslint-disable-next-line
  outputStream._write = function (chunk, encoding, done) {
    outputStr = `${outputStr}${chunk.toString()}`
    done()
  }

  through.pipe(outputStream)

  it('fails to evaluate regexes when included in repl context', async () => {
    const replServer = repl.start({
      terminal: false,
      useColors: false,
      useGlobal: true,
      output: through,
      input: inputStream,
    })
    addAwaitOutsideToReplServer(replServer)

    replServer.context.page = page
    replServer.context.queries = queries

    const commands = ["await queries.getByText(await page.$('#scoped'), /Hello/);", '.exit']

    commands.forEach(command => {
      inputStream.push(command)
      inputStream.push('\r')
    })
    inputStream.push(null)

    replServer.on('exit', () => {
      setTimeout(() => {
        through.end()
        outputStream.end()
      }, 1500)
    })

    await new Promise(resolve => {
      outputStream.on('finish', () => {
        expect(outputStr).toMatch('ElementHandle')
        expect(outputStr).not.toMatch('matcher.test is not a function')
        resolve()
      })
    })
  })

  afterEach(() => {
    configure({testIdAttribute: 'data-testid'}) // cleanup
  })

  afterAll(async () => {
    await browser.close()
  })
})
