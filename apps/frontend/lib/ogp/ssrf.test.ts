import { describe, it, expect } from 'vitest';
import { isPrivateIp } from '@/lib/ogp/ssrf';

describe('isPrivateIp', () => {
	describe('IPv4 private ranges', () => {
		const privateCases: [string, string][] = [
			['0.0.0.0', '0.0.0.0/8 - "This" network'],
			['0.255.255.255', '0.0.0.0/8 upper bound'],
			['10.0.0.1', '10.0.0.0/8 - Private RFC 1918'],
			['10.255.255.255', '10.0.0.0/8 upper bound'],
			['100.64.0.1', '100.64.0.0/10 - CGN RFC 6598'],
			['100.127.255.255', '100.64.0.0/10 upper bound'],
			['127.0.0.1', '127.0.0.0/8 - Loopback'],
			['127.255.255.255', '127.0.0.0/8 upper bound'],
			['169.254.0.1', '169.254.0.0/16 - Link-local'],
			['169.254.255.255', '169.254.0.0/16 upper bound'],
			['172.16.0.1', '172.16.0.0/12 - Private RFC 1918'],
			['172.31.255.255', '172.16.0.0/12 upper bound'],
			['192.0.0.1', '192.0.0.0/24 - IETF'],
			['192.0.2.1', '192.0.2.0/24 - TEST-NET-1'],
			['192.88.99.1', '192.88.99.0/24 - 6to4 relay'],
			['192.168.0.1', '192.168.0.0/16 - Private RFC 1918'],
			['192.168.255.255', '192.168.0.0/16 upper bound'],
			['198.18.0.1', '198.18.0.0/15 - Benchmarking'],
			['198.19.255.255', '198.18.0.0/15 upper bound'],
			['198.51.100.1', '198.51.100.0/24 - TEST-NET-2'],
			['203.0.113.1', '203.0.113.0/24 - TEST-NET-3'],
			['224.0.0.1', '224.0.0.0/4 - Multicast'],
			['239.255.255.255', '224.0.0.0/4 upper bound'],
			['240.0.0.1', '240.0.0.0/4 - Reserved'],
			['255.255.255.255', 'Broadcast'],
		];

		for (const [ip, desc] of privateCases) {
			it(`blocks ${ip} (${desc})`, () => {
				expect(isPrivateIp(ip)).toBe(true);
			});
		}
	});

	describe('IPv4 public ranges', () => {
		const publicCases: string[] = [
			'1.1.1.1',       // Cloudflare DNS
			'8.8.8.8',       // Google DNS
			'93.184.216.34', // example.com
			'100.63.255.255', // Just below CGN range
			'100.128.0.0',   // Just above CGN range
			'172.15.255.255', // Just below 172.16.0.0/12
			'172.32.0.0',     // Just above 172.16.0.0/12
			'192.0.3.0',     // Just above 192.0.2.0/24
			'198.17.255.255', // Just below 198.18.0.0/15
			'198.20.0.0',     // Just above 198.18.0.0/15
			'223.255.255.255', // Just below multicast range
		];

		for (const ip of publicCases) {
			it(`allows ${ip}`, () => {
				expect(isPrivateIp(ip)).toBe(false);
			});
		}
	});

	describe('IPv6 private ranges', () => {
		const privateCases: [string, string][] = [
			['::1', 'Loopback'],
			['::', 'Unspecified'],
			['::ffff:127.0.0.1', 'IPv4-mapped loopback'],
			['::ffff:192.168.1.1', 'IPv4-mapped private'],
			['::ffff:10.0.0.1', 'IPv4-mapped 10.x'],
			['fc00::1', 'Unique local fc00::/7'],
			['fd00::1', 'Unique local fd00::/8'],
			['fe80::1', 'Link-local'],
			['ff02::1', 'Multicast'],
			['2001:db8::1', 'Documentation'],
			['2002::1', '6to4 deprecated'],
		];

		for (const [ip, desc] of privateCases) {
			it(`blocks ${ip} (${desc})`, () => {
				expect(isPrivateIp(ip)).toBe(true);
			});
		}
	});

	describe('IPv6 public ranges', () => {
		const publicCases: string[] = [
			'2606:4700:4700::1111', // Cloudflare DNS
			'2001:4860:4860::8888', // Google DNS
		];

		for (const ip of publicCases) {
			it(`allows ${ip}`, () => {
				expect(isPrivateIp(ip)).toBe(false);
			});
		}
	});

	it('treats invalid input as private (deny by default)', () => {
		expect(isPrivateIp('not-an-ip')).toBe(true);
		expect(isPrivateIp('')).toBe(true);
	});
});
