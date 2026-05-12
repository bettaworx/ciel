//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_stats.g.dart';

/// UserStats
///
/// Properties:
/// * [postsCount] - Number of posts created by user
/// * [mediaCount] - Number of media items uploaded by user
/// * [reportsCount] - Number of reports submitted by user
@BuiltValue()
abstract class UserStats implements Built<UserStats, UserStatsBuilder> {
  /// Number of posts created by user
  @BuiltValueField(wireName: r'postsCount')
  int get postsCount;

  /// Number of media items uploaded by user
  @BuiltValueField(wireName: r'mediaCount')
  int get mediaCount;

  /// Number of reports submitted by user
  @BuiltValueField(wireName: r'reportsCount')
  int get reportsCount;

  UserStats._();

  factory UserStats([void updates(UserStatsBuilder b)]) = _$UserStats;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserStatsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserStats> get serializer => _$UserStatsSerializer();
}

class _$UserStatsSerializer implements PrimitiveSerializer<UserStats> {
  @override
  final Iterable<Type> types = const [UserStats, _$UserStats];

  @override
  final String wireName = r'UserStats';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserStats object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'postsCount';
    yield serializers.serialize(
      object.postsCount,
      specifiedType: const FullType(int),
    );
    yield r'mediaCount';
    yield serializers.serialize(
      object.mediaCount,
      specifiedType: const FullType(int),
    );
    yield r'reportsCount';
    yield serializers.serialize(
      object.reportsCount,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UserStats object, {
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
    required UserStatsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'postsCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.postsCount = valueDes;
          break;
        case r'mediaCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.mediaCount = valueDes;
          break;
        case r'reportsCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.reportsCount = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserStats deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserStatsBuilder();
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
