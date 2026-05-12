import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for UsersApi
void main() {
  final instance = CielApi().getUsersApi();

  group(UsersApi, () {
    // Accept agreements
    //
    // Record user acceptance of Terms of Service and/or Privacy Policy
    //
    //Future meAgreementsPost(AcceptAgreementsRequest acceptAgreementsRequest) async
    test('test meAgreementsPost', () async {
      // TODO
    });

    // Update current user avatar
    //
    // Upload an avatar image for the current user.  **Allowed formats:** PNG, JPG, JPEG, WebP, GIF   **File size limit:** 15 MiB (increased from 12 MiB) **Input dimension limits:** 16384x16384 pixels, 100 megapixels total   **Output resolution:** 400x400px (square, center-cropped)   **Quality:** 50 (optimized for file size)  **Processing:** - Images scaled to cover 400x400 - Center-cropped to square aspect ratio - Metadata stripped (EXIF/XMP/GPS) - Converted to static WebP format  **GIF handling:** - Animated GIFs accepted as input - Only the first frame is used (static output) - Final result is a 400x400px static WebP image  **Auto-cleanup:** - Previous avatar automatically deleted after successful upload
    //
    //Future<User> meAvatarPost(MultipartFile file) async
    test('test meAvatarPost', () async {
      // TODO
    });

    // Update current user banner
    //
    // Upload a profile banner image for the current user.  **Allowed formats:** PNG, JPG, JPEG, WebP, GIF   **File size limit:** 15 MiB   **Input dimension limits:** 16384x16384 pixels, 100 megapixels total   **Output resolution:** 1500x500px (center-cropped)   **Quality:** Configurable via `media.banner` in config.yaml  **Processing:** - Images scaled to cover 1500x500 - Center-cropped to 3:1 aspect ratio - Metadata stripped (EXIF/XMP/GPS) - Converted to WebP format  **GIF handling:** - Animated GIFs accepted as input - Converted to animated WebP - All frames preserved  **Auto-cleanup:** - Previous banner automatically deleted after successful upload
    //
    //Future<User> meBannerPost(MultipartFile file) async
    test('test meBannerPost', () async {
      // TODO
    });

    // Delete current user (step-up required)
    //
    //Future meDelete({ String xStepupToken }) async
    test('test meDelete', () async {
      // TODO
    });

    // Get current user
    //
    //Future<User> meGet() async
    test('test meGet', () async {
      // TODO
    });

    // Update current user profile
    //
    //Future<User> meProfilePatch(UpdateProfileRequest updateProfileRequest) async
    test('test meProfilePatch', () async {
      // TODO
    });

    // Change username (step-up required)
    //
    //Future<LoginFinishResponse> meUsernamePatch(UpdateUsernameRequest updateUsernameRequest, { String xStepupToken }) async
    test('test meUsernamePatch', () async {
      // TODO
    });

    // Get user by username
    //
    //Future<User> usersUsernameGet(String username) async
    test('test usersUsernameGet', () async {
      // TODO
    });

    // List posts by user
    //
    //Future<UserPostsPage> usersUsernamePostsGet(String username, { int limit, String cursor, PostMediaFilter mediaType }) async
    test('test usersUsernamePostsGet', () async {
      // TODO
    });
  });
}
