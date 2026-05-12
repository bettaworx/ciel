import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for AuthApi
void main() {
  final instance = CielApi().getAuthApi();

  group(AuthApi, () {
    // Finish challenge-response login
    //
    // Verifies `clientProof` for the one-time challenge. On success returns an access token.
    //
    //Future<LoginFinishResponse> authLoginFinishPost(LoginFinishRequest loginFinishRequest) async
    test('test authLoginFinishPost', () async {
      // TODO
    });

    // Start challenge-response login
    //
    // Starts a SCRAM-like login flow.  Client generates `clientNonce` and sends it. Server responds with per-user salt/iterations and `serverNonce`. Client then computes `clientProof` and calls /auth/login/finish.
    //
    //Future<LoginStartResponse> authLoginStartPost(LoginStartRequest loginStartRequest) async
    test('test authLoginStartPost', () async {
      // TODO
    });

    // Logout
    //
    // Stateless JWT logout is typically handled on the client. If you later add token revocation/blacklist, implement it here.
    //
    //Future authLogoutPost() async
    test('test authLogoutPost', () async {
      // TODO
    });

    // Change password (step-up required)
    //
    //Future<LoginFinishResponse> authPasswordChangePost(PasswordChangeRequest passwordChangeRequest, { String xStepupToken }) async
    test('test authPasswordChangePost', () async {
      // TODO
    });

    // Refresh access token
    //
    // Consumes the `ciel_refresh` HttpOnly cookie and issues a new access token cookie (`ciel_auth`) and a rotated refresh token cookie (`ciel_refresh`). Both cookies are set in the response. The refresh token is rotated on every use.
    //
    //Future<RefreshResponse> authRefreshPost() async
    test('test authRefreshPost', () async {
      // TODO
    });

    // Register a new user
    //
    // Minimal registration. In production, require HTTPS.  The server will generate `salt` and `iterations` and store verifier keys derived from the password (SCRAM-style storedKey/serverKey).
    //
    //Future<User> authRegisterPost(RegisterRequest registerRequest) async
    test('test authRegisterPost', () async {
      // TODO
    });

    // Finish step-up authentication
    //
    // Verifies `clientProof` for the step-up challenge and returns a short-lived token.
    //
    //Future<StepupFinishResponse> authStepupFinishPost(StepupFinishRequest stepupFinishRequest) async
    test('test authStepupFinishPost', () async {
      // TODO
    });

    // Start step-up authentication
    //
    // Starts a SCRAM-like step-up flow bound to the authenticated user.
    //
    //Future<StepupStartResponse> authStepupStartPost(StepupStartRequest stepupStartRequest) async
    test('test authStepupStartPost', () async {
      // TODO
    });
  });
}
