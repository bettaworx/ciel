import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function sanitize(value: string): string {
  return value.replace(/[\r\n]/g, '')
}

function buildCsp(nonce: string): string {
  const d = (key: string, fallback: string) =>
    sanitize(process.env[key] ?? fallback)

  // Nonce is always injected into script-src automatically.
  // Do not include 'nonce-*' manually in CSP_SCRIPT_SRC.
  const scriptSrc = `${d('CSP_SCRIPT_SRC', "'self'")} 'nonce-${nonce}'`

  return [
    `default-src ${d('CSP_DEFAULT_SRC', "'self'")}`,
    `script-src ${scriptSrc}`,
    `style-src ${d('CSP_STYLE_SRC', "'self' 'unsafe-inline'")}`,
    `img-src ${d('CSP_IMG_SRC', "'self' data: blob:")}`,
    `font-src ${d('CSP_FONT_SRC', "'self' data:")}`,
    `connect-src ${d('CSP_CONNECT_SRC', "'self'")}`,
    `media-src ${d('CSP_MEDIA_SRC', "'self'")}`,
    `object-src ${d('CSP_OBJECT_SRC', "'none'")}`,
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
