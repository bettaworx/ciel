import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for PostsApi
void main() {
  final instance = CielApi().getPostsApi();

  group(PostsApi, () {
    // Create a post
    //
    //Future<Post> postsPost(CreatePostRequest createPostRequest) async
    test('test postsPost', () async {
      // TODO
    });

    // Delete a post
    //
    //Future postsPostIdDelete(String postId) async
    test('test postsPostIdDelete', () async {
      // TODO
    });

    // Get a post
    //
    //Future<Post> postsPostIdGet(String postId) async
    test('test postsPostIdGet', () async {
      // TODO
    });
  });
}
