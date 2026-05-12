//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media_limits.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_config.g.dart';

/// ServerConfig
///
/// Properties:
/// * [signupEnabled] - Whether new user signups are currently allowed
/// * [configVersion] - Unix timestamp of last config update (for cache busting)
/// * [mediaLimits]
/// * [maxPostContentLength] - Maximum number of Unicode characters allowed in a post
@BuiltValue()
abstract class ServerConfig
    implements Built<ServerConfig, ServerConfigBuilder> {
  /// Whether new user signups are currently allowed
  @BuiltValueField(wireName: r'signupEnabled')
  bool get signupEnabled;

  /// Unix timestamp of last config update (for cache busting)
  @BuiltValueField(wireName: r'configVersion')
  int get configVersion;

  @BuiltValueField(wireName: r'mediaLimits')
  MediaLimits get mediaLimits;

  /// Maximum number of Unicode characters allowed in a post
  @BuiltValueField(wireName: r'maxPostContentLength')
  int get maxPostContentLength;

  ServerConfig._();

  factory ServerConfig([void updates(ServerConfigBuilder b)]) = _$ServerConfig;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerConfigBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerConfig> get serializer => _$ServerConfigSerializer();
}

class _$ServerConfigSerializer implements PrimitiveSerializer<ServerConfig> {
  @override
  final Iterable<Type> types = const [ServerConfig, _$ServerConfig];

  @override
  final String wireName = r'ServerConfig';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerConfig object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'signupEnabled';
    yield serializers.serialize(
      object.signupEnabled,
      specifiedType: const FullType(bool),
    );
    yield r'configVersion';
    yield serializers.serialize(
      object.configVersion,
      specifiedType: const FullType(int),
    );
    yield r'mediaLimits';
    yield serializers.serialize(
      object.mediaLimits,
      specifiedType: const FullType(MediaLimits),
    );
    yield r'maxPostContentLength';
    yield serializers.serialize(
      object.maxPostContentLength,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerConfig object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ServerConfigBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'signupEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.signupEnabled = valueDes;
          break;
        case r'configVersion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.configVersion = valueDes;
          break;
        case r'mediaLimits':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaLimits),
          ) as MediaLimits;
          result.mediaLimits.replace(valueDes);
          break;
        case r'maxPostContentLength':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.maxPostContentLength = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerConfig deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerConfigBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}
