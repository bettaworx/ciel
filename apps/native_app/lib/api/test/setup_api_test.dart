import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for SetupApi
void main() {
  final instance = CielApi().getSetupApi();

  group(SetupApi, () {
    // Complete server setup
    //
    // Finalize server setup with configuration
    //
    //Future<ServerSetupResponse> setupCompletePatch(ServerSetupRequest serverSetupRequest) async
    test('test setupCompletePatch', () async {
      // TODO
    });

    // Create admin account
    //
    // Create the initial admin account during server setup
    //
    //Future<CreateAdminResponse> setupCreateAdminPost(CreateAdminRequest createAdminRequest) async
    test('test setupCreateAdminPost', () async {
      // TODO
    });

    // Create invite code during setup
    //
    // Create the initial invite code during admin setup wizard
    //
    //Future<InviteCode> setupCreateInvitePost(CreateInviteCodeRequest createInviteCodeRequest) async
    test('test setupCreateInvitePost', () async {
      // TODO
    });

    // Get server setup status
    //
    // Check if the initial server setup has been completed
    //
    //Future<SetupStatusResponse> setupStatusGet() async
    test('test setupStatusGet', () async {
      // TODO
    });

    // Verify setup password
    //
    // Verify the initial setup password from environment variable
    //
    //Future<VerifySetupPasswordResponse> setupVerifyPasswordPost(VerifySetupPasswordRequest verifySetupPasswordRequest) async
    test('test setupVerifyPasswordPost', () async {
      // TODO
    });
  });
}
