import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for ServerApi
void main() {
  final instance = CielApi().getServerApi();

  group(ServerApi, () {
    // Get latest agreement content
    //
    // Public endpoint to retrieve the latest published agreement document content. No authentication required.
    //
    //Future<PublicAgreementContent> agreementsTypeLatestGet(AgreementType type, { AgreementLanguage language }) async
    test('test agreementsTypeLatestGet', () async {
      // TODO
    });

    // Get agreement content by version
    //
    // Public endpoint to retrieve agreement document content for a specific version. No authentication required.
    //
    //Future<PublicAgreementContent> agreementsTypeVersionGet(AgreementType type, int version, { AgreementLanguage language }) async
    test('test agreementsTypeVersionGet', () async {
      // TODO
    });

    // Get current agreement versions
    //
    // Public endpoint to retrieve current Terms of Service and Privacy Policy versions. No authentication required.
    //
    //Future<AgreementVersions> getAgreementVersions() async
    test('test getAgreementVersions', () async {
      // TODO
    });

    // Get public server configuration
    //
    // Public endpoint to retrieve server configuration including signup settings and media limits. No authentication required.
    //
    //Future<ServerConfig> getServerConfig() async
    test('test getServerConfig', () async {
      // TODO
    });

    // Get public server information
    //
    // Public endpoint to retrieve server metadata including name, description, icon, and stats. No authentication required.
    //
    //Future<ServerInfo> getServerInfo() async
    test('test getServerInfo', () async {
      // TODO
    });
  });
}
