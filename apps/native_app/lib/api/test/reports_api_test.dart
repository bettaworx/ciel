import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for ReportsApi
void main() {
  final instance = CielApi().getReportsApi();

  group(ReportsApi, () {
    // Create a report
    //
    // Submit a report for a user, post, or media item
    //
    //Future<Report> reportsPost(CreateReportRequest createReportRequest) async
    test('test reportsPost', () async {
      // TODO
    });
  });
}
