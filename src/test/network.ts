// Tests never reach a real server: every request is refused and remembered,
// and the test that made it fails (see setup.ts). Mock '@/shared/api/client' instead.

const attempts: string[] = []

const refuse = (what: string) => {
  attempts.push(what)
  return new Error(
    `Testda tarmoqqa so'rov: ${what}. '@/shared/api/client'ni vi.mock bilan almashtiring.`,
  )
}

export function blockNetwork() {
  globalThis.fetch = (input: RequestInfo | URL) =>
    Promise.reject(refuse(`fetch ${input instanceof Request ? input.url : String(input)}`))

  // axios in jsdom goes through XMLHttpRequest.
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
    throw refuse(`${method.toUpperCase()} ${String(url)}`)
  }
  XMLHttpRequest.prototype.send = function () {
    throw refuse('XMLHttpRequest.send')
  }
}

/** Requests tried since the last call; clears the list. */
export function takeNetworkAttempts() {
  return attempts.splice(0)
}
