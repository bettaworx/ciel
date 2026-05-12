//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/server_stats.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_info.g.dart';

/// ServerInfo
///
/// Properties:
/// * [stats]
/// * [serverName] - Display name of the server instance
/// * [serverDescription] - Description/about text of the server
/// * [serverIconUrl] - Public URL of the server icon/logo
/// * [commit] - Build version identifier (commit hash or \"dev\")
/// * [branch] - Git branch name (or \"dev\" in development)
/// * [version] - Semantic version of the server (e.g. \"0.1.0\")
@BuiltValue()
abstract class ServerInfo implements Built<ServerInfo, ServerInfoBuilder> {
  @BuiltValueField(wireName: r'stats')
  ServerStats get stats;

  /// Display name of the server instance
  @BuiltValueField(wireName: r'serverName')
  String? get serverName;

  /// Description/about text of the server
  @BuiltValueField(wireName: r'serverDescription')
  String? get serverDescription;

  /// Public URL of the server icon/logo
  @BuiltValueField(wireName: r'serverIconUrl')
  String? get serverIconUrl;

  /// Build version identifier (commit hash or \"dev\")
  @BuiltValueField(wireName: r'commit')
  String? get commit;

  /// Git branch name (or \"dev\" in development)
  @BuiltValueField(wireName: r'branch')
  String? get branch;

  /// Semantic version of the server (e.g. \"0.1.0\")
  @BuiltValueField(wireName: r'version')
  String? get version;

  ServerInfo._();

  factory ServerInfo([void updates(ServerInfoBuilder b)]) = _$ServerInfo;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerInfoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerInfo> get serializer => _$ServerInfoSerializer();
}

class _$ServerInfoSerializer implements PrimitiveSerializer<ServerInfo> {
  @override
  final Iterable<Type> types = const [ServerInfo, _$ServerInfo];

  @override
  final String wireName = r'ServerInfo';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerInfo object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'stats';
    yield serializers.serialize(
      object.stats,
      specifiedType: const FullType(ServerStats),
    );
    if (object.serverName != null) {
      yield r'serverName';
      yield serializers.serialize(
        object.serverName,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.serverDescription != null) {
      yield r'serverDescription';
      yield serializers.serialize(
        object.serverDescription,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.serverIconUrl != null) {
      yield r'serverIconUrl';
      yield serializers.serialize(
        object.serverIconUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.commit != null) {
      yield r'commit';
      yield serializers.serialize(
        object.commit,
        specifiedType: const FullType(String),
      );
    }
    if (object.branch != null) {
      yield r'branch';
      yield serializers.serialize(
        object.branch,
        specifiedType: const FullType(String),
      );
    }
    if (object.version != null) {
      yield r'version';
      yield serializers.serialize(
        object.version,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerInfo object, {
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
    required ServerInfoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'stats':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ServerStats),
          ) as ServerStats;
          result.stats.replace(valueDes);
          break;
        case r'serverName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.serverName = valueDes;
          break;
        case r'serverDescription':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.serverDescription = valueDes;
          break;
        case r'serverIconUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.serverIconUrl = valueDes;
          break;
        case r'commit':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.commit = valueDes;
          break;
        case r'branch':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.branch = valueDes;
          break;
        case r'version':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.version = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerInfo deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerInfoBuilder();
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
