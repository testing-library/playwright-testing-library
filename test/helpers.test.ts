import {convertProxyToRegExp, convertRegExpToProxy} from '../lib/helpers'

describe('convertRegExpToProxy', () => {
  it('converts single `RegExp` to proxy object', () => {
    expect(convertRegExpToProxy(/\w+/i)).toEqual({__flags: 'i', __regex: '\\w+'})
  })

  it('converts nested `RegExp` to nested proxy object', () => {
    const nested = {
      option1: 'foo',
      option2: false,
      name: /\w+/i,
    }

    expect(convertRegExpToProxy(nested)).toEqual({
      option1: 'foo',
      option2: false,
      name: {__flags: 'i', __regex: '\\w+'},
    })
  })
})

describe('convertProxyToRegExp', () => {
  it('converts single proxy back to `RegExp`', () => {
    expect(convertProxyToRegExp({__flags: 'i', __regex: '\\w+'})).toEqual(/\w+/i)
  })

  it('converts nested proxy back to `RegExp`', () => {
    const nested = {
      option1: 'foo',
      option2: false,
      name: {__flags: 'i', __regex: '\\w+'},
    }

    expect(convertProxyToRegExp(nested)).toEqual({
      option1: 'foo',
      option2: false,
      name: /\w+/i,
    })
  })
})
