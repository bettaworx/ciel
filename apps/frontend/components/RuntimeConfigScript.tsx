import { RUNTIME_CONFIG_SCRIPT_ID } from '@/lib/api/base-url';
import { getPublicApiBaseUrl } from '@/lib/server/api-base-url';

function serializeRuntimeConfig(config: unknown): string {
	return JSON.stringify(config).replace(/[<>&\u2028\u2029]/g, (char) => {
		switch (char) {
			case '<':
				return '\\u003c';
			case '>':
				return '\\u003e';
			case '&':
				return '\\u0026';
			case '\u2028':
				return '\\u2028';
			case '\u2029':
				return '\\u2029';
			default:
				return char;
		}
	});
}

type RuntimeConfigScriptProps = {
	nonce?: string;
};

export function RuntimeConfigScript({ nonce }: RuntimeConfigScriptProps) {
	const runtimeConfig = {
		apiBaseUrl: getPublicApiBaseUrl(),
	};

	return (
		<script
			id={RUNTIME_CONFIG_SCRIPT_ID}
			type="application/json"
			nonce={nonce}
			dangerouslySetInnerHTML={{
				__html: serializeRuntimeConfig(runtimeConfig),
			}}
		/>
	);
}
