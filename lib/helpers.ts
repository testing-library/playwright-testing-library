/* istanbul ignore next */
function convertProxyToRegExp(o: any, depth: number = 0): any {
  if (typeof o !== 'object' || !o || depth > 2) return o

  if (!o.__regex || typeof o.__flags !== 'string') {
    const copy = {...o}

    for (const key of Object.keys(copy)) {
      copy[key] = convertProxyToRegExp(copy[key], depth + 1)
    }

    return copy
  }

  return new RegExp(o.__regex, o.__flags)
}

/* istanbul ignore next */
function mapArgument(o: any): any {
  return convertProxyToRegExp(o, 0)
}

function convertRegExpToProxy(o: any, depth: number = 0): any {
  if (typeof o !== 'object' || !o || depth > 2) return o

  if (!(o instanceof RegExp)) {
    const copy = {...o}

    for (const key of Object.keys(copy)) {
      copy[key] = convertRegExpToProxy(copy[key], depth + 1)
    }

    return copy
  }

  return {__regex: o.source, __flags: o.flags}
}

export {convertProxyToRegExp, convertRegExpToProxy, mapArgument}
