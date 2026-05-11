export type CspDirective =
  | 'default-src'
  | 'script-src'
  | 'style-src'
  | 'img-src'
  | 'font-src'
  | 'connect-src'
  | 'media-src'
  | 'object-src'
  | 'frame-src'
  | 'base-uri'
  | 'form-action'
  | 'frame-ancestors'

type CspRegistry = Partial<Record<CspDirective, string[]>>

const registry: CspRegistry = {}

export function registerCspSources(directive: CspDirective, ...sources: string[]): void {
  if (!registry[directive]) registry[directive] = []
  registry[directive]!.push(...sources)
}

export function getRegisteredSources(directive: CspDirective): string[] {
  return registry[directive] ?? []
}
