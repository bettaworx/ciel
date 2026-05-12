import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for IPBan
void main() {
  final instance = IPBanBuilder();
  // TODO add properties to the builder and call build()

  group(IPBan, () {
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // IP address (IPv4 or IPv6)
    // String ipAddress
    test('to test the property `ipAddress`', () async {
      // TODO
    });

    // Admin user ID who created this ban
    // String bannedBy
    test('to test the property `bannedBy`', () async {
      // TODO
    });

    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // Reason for the ban
    // String reason
    test('to test the property `reason`', () async {
      // TODO
    });

    // When the ban expires (null = permanent)
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });
  });
}
