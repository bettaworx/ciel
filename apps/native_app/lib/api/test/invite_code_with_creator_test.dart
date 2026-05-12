import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for InviteCodeWithCreator
void main() {
  final instance = InviteCodeWithCreatorBuilder();
  // TODO add properties to the builder and call build()

  group(InviteCodeWithCreator, () {
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // Invite code (auto-generated 8-char or custom up to 32 chars)
    // String code
    test('to test the property `code`', () async {
      // TODO
    });

    // User ID of creator
    // String createdBy
    test('to test the property `createdBy`', () async {
      // TODO
    });

    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // Number of times this code has been used
    // int useCount
    test('to test the property `useCount`', () async {
      // TODO
    });

    // Whether this code has been disabled
    // bool disabled
    test('to test the property `disabled`', () async {
      // TODO
    });

    // Username of the creator
    // String creatorUsername
    test('to test the property `creatorUsername`', () async {
      // TODO
    });

    // DateTime lastUsedAt
    test('to test the property `lastUsedAt`', () async {
      // TODO
    });

    // Maximum allowed uses. null = unlimited
    // int maxUses
    test('to test the property `maxUses`', () async {
      // TODO
    });

    // Expiration date. null = never expires
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });

    // Optional note about this invite code
    // String note
    test('to test the property `note`', () async {
      // TODO
    });

    // Display name of the creator
    // String creatorDisplayName
    test('to test the property `creatorDisplayName`', () async {
      // TODO
    });
  });
}
