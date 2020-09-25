declare module 'await-outside' {
  import {REPLServer} from 'repl'

  // eslint-disable-next-line
  export function addAwaitOutsideToReplServer(repl: REPLServer): void
}
