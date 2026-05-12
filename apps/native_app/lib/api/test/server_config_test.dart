import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for ServerConfig
void main() {
  final instance = ServerConfigBuilder();
  // TODO add properties to the builder and call build()

  group(ServerConfig, () {
    // Whether new user signups are currently allowed
    // bool signupEnabled
    test('to test the property `signupEnabled`', () async {
      // TODO
    });

    // Unix timestamp of last config update (for cache busting)
    // int configVersion
    test('to test the property `configVersion`', () async {
      // TODO
    });

    // MediaLimits mediaLimits
    test('to test the property `mediaLimits`', () async {
      // TODO
    });

    // Maximum number of Unicode characters allowed in a post
    // int maxPostContentLength
    test('to test the property `maxPostContentLength`', () async {
      // TODO
    });
  });
}
