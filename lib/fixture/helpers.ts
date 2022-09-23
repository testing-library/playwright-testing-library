class TestingLibraryDeserializedFunction extends Function {
  original: string

  constructor(fn: string) {
    super(`return (${fn}).apply(this, arguments)`)

    this.original = fn
  }
}

const replacer = (_: string, value: unknown) => {
  if (value instanceof RegExp) return `__REGEXP ${value.toString()}`
  if (typeof value === 'function') return `__FUNCTION ${value.toString()}`

  return value
}

const reviver = (_: string, value: string) => {
  if (value.toString().includes('__REGEXP ')) {
    const match = /\/(.*)\/(.*)?/.exec(value.split('__REGEXP ')[1])

    return new RegExp(match![1], match![2] || '')
  }

  if (value.toString().includes('__FUNCTION ')) {
    return new TestingLibraryDeserializedFunction(value.split('__FUNCTION ')[1])
  }

  return value
}

export {TestingLibraryDeserializedFunction, replacer, reviver}
