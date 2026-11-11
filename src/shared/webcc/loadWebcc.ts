import type { Runtime as WebccRuntime } from 'webcc'

export type { WebccRuntime }
export type WebccRuntimeClass = new (token: string, containerId?: string) => WebccRuntime

/**
 * The constructor, loaded only where it's drawn: ~2.2 MB, its own chunk. The bundle is CommonJS
 * (webpack), so its exports come as `default` — or as names, depending on the bundler.
 */
export async function loadWebcc(): Promise<WebccRuntimeClass> {
  const mod = (await import('webcc')) as unknown as {
    Runtime?: WebccRuntimeClass
    default?: { Runtime?: WebccRuntimeClass }
  }
  const Runtime = mod.Runtime ?? mod.default?.Runtime
  if (!Runtime) throw new Error('webcc: Runtime not found')
  return Runtime
}
