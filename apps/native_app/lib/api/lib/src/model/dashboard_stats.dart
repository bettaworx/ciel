//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dashboard_stats.g.dart';

/// DashboardStats
///
/// Properties:
/// * [totalUsers] - Total number of users (non-deleted)
/// * [totalPosts] - Total number of posts (non-deleted)
/// * [totalMedia] - Total number of media items (non-deleted)
@BuiltValue()
abstract class DashboardStats
    implements Built<DashboardStats, DashboardStatsBuilder> {
  /// Total number of users (non-deleted)
  @BuiltValueField(wireName: r'totalUsers')
  int get totalUsers;

  /// Total number of posts (non-deleted)
  @BuiltValueField(wireName: r'totalPosts')
  int get totalPosts;

  /// Total number of media items (non-deleted)
  @BuiltValueField(wireName: r'totalMedia')
  int get totalMedia;

  DashboardStats._();

  factory DashboardStats([void updates(DashboardStatsBuilder b)]) =
      _$DashboardStats;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DashboardStatsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DashboardStats> get serializer =>
      _$DashboardStatsSerializer();
}

class _$DashboardStatsSerializer
    implements PrimitiveSerializer<DashboardStats> {
  @override
  final Iterable<Type> types = const [DashboardStats, _$DashboardStats];

  @override
  final String wireName = r'DashboardStats';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DashboardStats object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'totalUsers';
    yield serializers.serialize(
      object.totalUsers,
      specifiedType: const FullType(int),
    );
    yield r'totalPosts';
    yield serializers.serialize(
      object.totalPosts,
      specifiedType: const FullType(int),
    );
    yield r'totalMedia';
    yield serializers.serialize(
      object.totalMedia,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DashboardStats object, {
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
    required DashboardStatsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'totalUsers':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalUsers = valueDes;
          break;
        case r'totalPosts':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalPosts = valueDes;
          break;
        case r'totalMedia':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalMedia = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DashboardStats deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DashboardStatsBuilder();
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
