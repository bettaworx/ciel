import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

// tests for ModerationLog
void main() {
  final instance = ModerationLogBuilder();
  // TODO add properties to the builder and call build()

  group(ModerationLog, () {
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // Admin user who performed the action (null for system actions)
    // String adminUserId
    test('to test the property `adminUserId`', () async {
      // TODO
    });

    // ModerationAction action
    test('to test the property `action`', () async {
      // TODO
    });

    // ModerationTargetType targetType
    test('to test the property `targetType`', () async {
      // TODO
    });

    // ID of the target (format depends on target type)
    // String targetId
    test('to test the property `targetId`', () async {
      // TODO
    });

    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // Username of admin who performed the action
    // String adminUsername
    test('to test the property `adminUsername`', () async {
      // TODO
    });

    // Display name of admin who performed the action
    // String adminDisplayName
    test('to test the property `adminDisplayName`', () async {
      // TODO
    });

    // Additional details about the action (JSON object)
    // JsonObject details
    test('to test the property `details`', () async {
      // TODO
    });
  });
}
