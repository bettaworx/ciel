//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_ip_ban_request.g.dart';

/// CreateIPBanRequest
///
/// Properties:
/// * [ipAddress] - IP address to ban (IPv4 or IPv6)
/// * [reason] - Reason for the ban
/// * [expiresAt] - When the ban should expire (null = permanent)
@BuiltValue()
abstract class CreateIPBanRequest
    implements Built<CreateIPBanRequest, CreateIPBanRequestBuilder> {
  /// IP address to ban (IPv4 or IPv6)
  @BuiltValueField(wireName: r'ipAddress')
  String get ipAddress;

  /// Reason for the ban
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  /// When the ban should expire (null = permanent)
  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  CreateIPBanRequest._();

  factory CreateIPBanRequest([void updates(CreateIPBanRequestBuilder b)]) =
      _$CreateIPBanRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateIPBanRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateIPBanRequest> get serializer =>
      _$CreateIPBanRequestSerializer();
}

class _$CreateIPBanRequestSerializer
    implements PrimitiveSerializer<CreateIPBanRequest> {
  @override
  final Iterable<Type> types = const [CreateIPBanRequest, _$CreateIPBanRequest];

  @override
  final String wireName = r'CreateIPBanRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateIPBanRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ipAddress';
    yield serializers.serialize(
      object.ipAddress,
      specifiedType: const FullType(String),
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
    CreateIPBanRequest object, {
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
    required CreateIPBanRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ipAddress':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ipAddress = valueDes;
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
  CreateIPBanRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateIPBanRequestBuilder();
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
