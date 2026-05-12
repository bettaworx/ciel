import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for SystemApi
void main() {
  final instance = CielApi().getSystemApi();

  group(SystemApi, () {
    // Health Check
    //
    //Future healthGet() async
    test('test healthGet', () async {
      // TODO
    });
  });
}
