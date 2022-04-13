const replacer = (_: string, value: unknown) => {
  if (value instanceof RegExp) return `__REGEXP ${value.toString()}`

  return value
}

const reviver = (_: string, value: string) => {
  if (value.toString().includes('__REGEXP ')) {
    const match = /\/(.*)\/(.*)?/.exec(value.split('__REGEXP ')[1])

    return new RegExp(match![1], match![2] || '')
  }

  return value
}

export {replacer, reviver}
