import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRegisteredSources } from '@/lib/csp'

function sanitize(value: string): string {
  return value.replace(/[\r\n]/g, '')
}

function originSource(value: string | undefined): string[] {
  const raw = value?.trim()
  if (!raw) return []

  try {
    return [new URL(raw).origin]
  } catch {
    return []
  }
}

function websocketSource(value: string | undefined): string[] {
  const raw = value?.trim()
  if (!raw) return []

  try {
    const url = new URL(raw)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = ''
    url.search = ''
    url.hash = ''
    return [url.origin]
  } catch {
    return []
  }
}

function sourceList(...sources: string[][]): string {
  const unique = [...new Set(sources.flat().map(sanitize))]
  return unique.length ? ' ' + unique.join(' ') : ''
}

function backendHttpSources(): string[] {
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:6137'
  return [
    ...originSource(apiBaseUrl),
    ...originSource(process.env.PUBLIC_BASE_URL),
  ]
}

function backendWebSocketSources(): string[] {
  return websocketSource(process.env.API_BASE_URL || 'http://localhost:6137')
}

function buildCsp(nonce: string): string {
  const d = (key: string, fallback: string) =>
    sanitize(process.env[key] || fallback)

  const extra = (directive: Parameters<typeof getRegisteredSources>[0]) => {
    const sources = getRegisteredSources(directive)
    return sources.length ? ' ' + sources.join(' ') : ''
  }

  // Nonce is always injected into script-src automatically.
  // Do not include 'nonce-*' manually in CSP_SCRIPT_SRC.
  const scriptSrc = `${d('CSP_SCRIPT_SRC', "'self'")} 'nonce-${nonce}'${extra('script-src')}`

  return [
    `default-src ${d('CSP_DEFAULT_SRC', "'self'")}`,
    `script-src ${scriptSrc}`,
    `style-src ${d('CSP_STYLE_SRC', "'self' 'unsafe-inline'")}${extra('style-src')}`,
    `img-src ${d('CSP_IMG_SRC', "'self' data: blob:")}${extra('img-src')}${sourceList(backendHttpSources())}`,
    `font-src ${d('CSP_FONT_SRC', "'self' data:")}${extra('font-src')}`,
    `connect-src ${d('CSP_CONNECT_SRC', "'self'")}${extra('connect-src')}${sourceList(backendHttpSources(), backendWebSocketSources())}`,
    `media-src ${d('CSP_MEDIA_SRC', "'self' blob:")}${extra('media-src')}${sourceList(backendHttpSources())}`,
    `object-src ${d('CSP_OBJECT_SRC', "'none'")}`,
    `frame-src ${d('CSP_FRAME_SRC', "'self'")}${extra('frame-src')}`,
    `base-uri ${d('CSP_BASE_URI', "'self'")}`,
    `form-action ${d('CSP_FORM_ACTION', "'self'")}`,
    `frame-ancestors ${d('CSP_FRAME_ANCESTORS', "'none'")}`,
  ].join('; ')
}

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())
  const csp = buildCsp(nonce)

  // In development, use Report-Only mode so HMR and fast refresh are not blocked.
  // Violations are logged to the browser console but nothing is blocked.
  const cspHeader =
    process.env.NODE_ENV === 'development'
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy'

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  response.headers.set(cspHeader, csp)

  return response
}

export const config = {
  matcher: [
    {
      // Apply to all routes except Next.js internals and static assets.
      source:
        '/((?!_next/static|_next/image|favicon\\.ico|pwa/|icon|sw\\.js).*)',
      missing: [
        // Skip Next.js prefetch requests — they don't render HTML.
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
