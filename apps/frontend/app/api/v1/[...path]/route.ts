import { type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND = (process.env.API_BASE_URL ?? 'http://localhost:6137').replace(/\/+$/, '');

type Params = Promise<{ path: string[] }>;

async function proxy(request: NextRequest, { params }: { params: Params }): Promise<Response> {
	const { path } = await params;
	const search = request.nextUrl.search;
	const target = `${BACKEND}/api/v1/${path.join('/')}${search}`;

	const headers = new Headers(request.headers);
	headers.delete('host');

	const upstream = await fetch(target, {
		method: request.method,
		headers,
		body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
		// @ts-expect-error – Node.js fetch requires duplex for streaming request bodies
		duplex: 'half',
	});

	return new Response(upstream.body, {
		status: upstream.status,
		headers: upstream.headers,
	});
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
