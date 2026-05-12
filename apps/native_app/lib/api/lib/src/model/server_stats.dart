//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_stats.g.dart';

/// ServerStats
///
/// Properties:
/// * [userCount] - Total number of registered users
/// * [postCount] - Total number of active (non-deleted) posts
@BuiltValue()
abstract class ServerStats implements Built<ServerStats, ServerStatsBuilder> {
  /// Total number of registered users
  @BuiltValueField(wireName: r'userCount')
  int get userCount;

  /// Total number of active (non-deleted) posts
  @BuiltValueField(wireName: r'postCount')
  int get postCount;

  ServerStats._();

  factory ServerStats([void updates(ServerStatsBuilder b)]) = _$ServerStats;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerStatsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerStats> get serializer => _$ServerStatsSerializer();
}

class _$ServerStatsSerializer implements PrimitiveSerializer<ServerStats> {
  @override
  final Iterable<Type> types = const [ServerStats, _$ServerStats];

  @override
  final String wireName = r'ServerStats';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerStats object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'userCount';
    yield serializers.serialize(
      object.userCount,
      specifiedType: const FullType(int),
    );
    yield r'postCount';
    yield serializers.serialize(
      object.postCount,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerStats object, {
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
    required ServerStatsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'userCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.userCount = valueDes;
          break;
        case r'postCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.postCount = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerStats deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerStatsBuilder();
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
