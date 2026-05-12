import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for UpdateInviteCodeRequest
void main() {
  final instance = UpdateInviteCodeRequestBuilder();
  // TODO add properties to the builder and call build()

  group(UpdateInviteCodeRequest, () {
    // Updated invite code (1-32 characters, alphanumeric with underscore/hyphen). Must be unique. Omit this field to keep the existing code.
    // String code
    test('to test the property `code`', () async {
      // TODO
    });

    // Maximum number of times this code can be used. null = unlimited. Omit this field to keep the existing value.
    // int maxUses
    test('to test the property `maxUses`', () async {
      // TODO
    });

    // Expiration date/time in ISO 8601 format. null = never expires. Omit this field to keep the existing value.
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });

    // Updated note about this invite code (e.g., \"For beta testers\"). null = clear the note. Omit this field to keep the existing value.
    // String note
    test('to test the property `note`', () async {
      // TODO
    });
  });
}
