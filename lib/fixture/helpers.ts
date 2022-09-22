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
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return new Function(`return (${value.split('__FUNCTION ')[1]}).apply(this, arguments)`)
  }

  return value
}

export {replacer, reviver}
