import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for CreateIPBanRequest
void main() {
  final instance = CreateIPBanRequestBuilder();
  // TODO add properties to the builder and call build()

  group(CreateIPBanRequest, () {
    // IP address to ban (IPv4 or IPv6)
    // String ipAddress
    test('to test the property `ipAddress`', () async {
      // TODO
    });

    // Reason for the ban
    // String reason
    test('to test the property `reason`', () async {
      // TODO
    });

    // When the ban should expire (null = permanent)
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });
  });
}
