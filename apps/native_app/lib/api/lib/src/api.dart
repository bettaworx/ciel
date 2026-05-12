//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:dio/dio.dart';
import 'package:built_value/serializer.dart';
import 'package:ciel_api/src/serializers.dart';
import 'package:ciel_api/src/auth/api_key_auth.dart';
import 'package:ciel_api/src/auth/basic_auth.dart';
import 'package:ciel_api/src/auth/bearer_auth.dart';
import 'package:ciel_api/src/auth/oauth.dart';
import 'package:ciel_api/src/api/admin_api.dart';
import 'package:ciel_api/src/api/auth_api.dart';
import 'package:ciel_api/src/api/emojis_api.dart';
import 'package:ciel_api/src/api/media_api.dart';
import 'package:ciel_api/src/api/posts_api.dart';
import 'package:ciel_api/src/api/reactions_api.dart';
import 'package:ciel_api/src/api/reports_api.dart';
import 'package:ciel_api/src/api/server_api.dart';
import 'package:ciel_api/src/api/setup_api.dart';
import 'package:ciel_api/src/api/system_api.dart';
import 'package:ciel_api/src/api/timeline_api.dart';
import 'package:ciel_api/src/api/users_api.dart';

class CielApi {
  static const String basePath = r'http://localhost:6137/api/v1';

  final Dio dio;
  final Serializers serializers;

  CielApi({
    Dio? dio,
    Serializers? serializers,
    String? basePathOverride,
    List<Interceptor>? interceptors,
  })  : this.serializers = serializers ?? standardSerializers,
        this.dio = dio ??
            Dio(BaseOptions(
              baseUrl: basePathOverride ?? basePath,
              connectTimeout: const Duration(milliseconds: 5000),
              receiveTimeout: const Duration(milliseconds: 3000),
            )) {
    if (interceptors == null) {
      this.dio.interceptors.addAll([
        OAuthInterceptor(),
        BasicAuthInterceptor(),
        BearerAuthInterceptor(),
        ApiKeyAuthInterceptor(),
      ]);
    } else {
      this.dio.interceptors.addAll(interceptors);
    }
  }

  void setOAuthToken(String name, String token) {
    if (this.dio.interceptors.any((i) => i is OAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is OAuthInterceptor)
              as OAuthInterceptor)
          .tokens[name] = token;
    }
  }

  void setBearerAuth(String name, String token) {
    if (this.dio.interceptors.any((i) => i is BearerAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BearerAuthInterceptor)
              as BearerAuthInterceptor)
          .tokens[name] = token;
    }
  }

  void setBasicAuth(String name, String username, String password) {
    if (this.dio.interceptors.any((i) => i is BasicAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BasicAuthInterceptor)
              as BasicAuthInterceptor)
          .authInfo[name] = BasicAuthInfo(username, password);
    }
  }

  void setApiKey(String name, String apiKey) {
    if (this.dio.interceptors.any((i) => i is ApiKeyAuthInterceptor)) {
      (this
                  .dio
                  .interceptors
                  .firstWhere((element) => element is ApiKeyAuthInterceptor)
              as ApiKeyAuthInterceptor)
          .apiKeys[name] = apiKey;
    }
  }

  /// Get AdminApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AdminApi getAdminApi() {
    return AdminApi(dio, serializers);
  }

  /// Get AuthApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AuthApi getAuthApi() {
    return AuthApi(dio, serializers);
  }

  /// Get EmojisApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  EmojisApi getEmojisApi() {
    return EmojisApi(dio, serializers);
  }

  /// Get MediaApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  MediaApi getMediaApi() {
    return MediaApi(dio, serializers);
  }

  /// Get PostsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  PostsApi getPostsApi() {
    return PostsApi(dio, serializers);
  }

  /// Get ReactionsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ReactionsApi getReactionsApi() {
    return ReactionsApi(dio, serializers);
  }

  /// Get ReportsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ReportsApi getReportsApi() {
    return ReportsApi(dio, serializers);
  }

  /// Get ServerApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ServerApi getServerApi() {
    return ServerApi(dio, serializers);
  }

  /// Get SetupApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SetupApi getSetupApi() {
    return SetupApi(dio, serializers);
  }

  /// Get SystemApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SystemApi getSystemApi() {
    return SystemApi(dio, serializers);
  }

  /// Get TimelineApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  TimelineApi getTimelineApi() {
    return TimelineApi(dio, serializers);
  }

  /// Get UsersApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  UsersApi getUsersApi() {
    return UsersApi(dio, serializers);
  }
}
