//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ip_ban.g.dart';

/// IPBan
///
/// Properties:
/// * [id]
/// * [ipAddress] - IP address (IPv4 or IPv6)
/// * [bannedBy] - Admin user ID who created this ban
/// * [createdAt]
/// * [reason] - Reason for the ban
/// * [expiresAt] - When the ban expires (null = permanent)
@BuiltValue()
abstract class IPBan implements Built<IPBan, IPBanBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  /// IP address (IPv4 or IPv6)
  @BuiltValueField(wireName: r'ipAddress')
  String get ipAddress;

  /// Admin user ID who created this ban
  @BuiltValueField(wireName: r'bannedBy')
  String get bannedBy;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// Reason for the ban
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  /// When the ban expires (null = permanent)
  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  IPBan._();

  factory IPBan([void updates(IPBanBuilder b)]) = _$IPBan;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(IPBanBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<IPBan> get serializer => _$IPBanSerializer();
}

class _$IPBanSerializer implements PrimitiveSerializer<IPBan> {
  @override
  final Iterable<Type> types = const [IPBan, _$IPBan];

  @override
  final String wireName = r'IPBan';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    IPBan object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'ipAddress';
    yield serializers.serialize(
      object.ipAddress,
      specifiedType: const FullType(String),
    );
    yield r'bannedBy';
    yield serializers.serialize(
      object.bannedBy,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.expiresAt != null) {
      yield r'expiresAt';
      yield serializers.serialize(
        object.expiresAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    IPBan object, {
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
    required IPBanBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'ipAddress':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ipAddress = valueDes;
          break;
        case r'bannedBy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.bannedBy = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reason = valueDes;
          break;
        case r'expiresAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.expiresAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  IPBan deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = IPBanBuilder();
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
