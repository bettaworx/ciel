import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for LoginFinishRequest
void main() {
  final instance = LoginFinishRequestBuilder();
  // TODO add properties to the builder and call build()

  group(LoginFinishRequest, () {
    // String loginSessionId
    test('to test the property `loginSessionId`', () async {
      // TODO
    });

    // Typically clientNonce + serverNonce.
    // String clientFinalNonce
    test('to test the property `clientFinalNonce`', () async {
      // TODO
    });

    // Base64-encoded proof computed by the client.
    // String clientProof
    test('to test the property `clientProof`', () async {
      // TODO
    });
  });
}
