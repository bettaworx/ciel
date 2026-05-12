import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for TimelineApi
void main() {
  final instance = CielApi().getTimelineApi();

  group(TimelineApi, () {
    // Get timeline (paginated)
    //
    // Returns a paginated timeline.  Implementation note: can be backed by Redis (e.g., ZSET of postIds), and should remove deleted posts from cache.
    //
    //Future<TimelinePage> timelineGet({ int limit, String cursor }) async
    test('test timelineGet', () async {
      // TODO
    });
  });
}
