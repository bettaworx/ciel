import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for ReactionsApi
void main() {
  final instance = CielApi().getReactionsApi();

  group(ReactionsApi, () {
    // Remove a reaction
    //
    //Future<ReactionCounts> postsPostIdReactionsDelete(String postId, String emoji) async
    test('test postsPostIdReactionsDelete', () async {
      // TODO
    });

    // Get reaction counts for a post
    //
    //Future<ReactionCounts> postsPostIdReactionsGet(String postId) async
    test('test postsPostIdReactionsGet', () async {
      // TODO
    });

    // Add a reaction
    //
    // One user can add a specific emoji once per post.
    //
    //Future<ReactionCounts> postsPostIdReactionsPost(String postId, ReactRequest reactRequest) async
    test('test postsPostIdReactionsPost', () async {
      // TODO
    });

    // Get users who reacted with an emoji
    //
    //Future<ReactionUsersPage> postsPostIdReactionsUsersGet(String postId, String emoji, { int limit, String cursor }) async
    test('test postsPostIdReactionsUsersGet', () async {
      // TODO
    });
  });
}
