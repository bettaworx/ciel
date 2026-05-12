//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ban_user_request.g.dart';

/// BanUserRequest
///
/// Properties:
/// * [ttlSeconds]
@BuiltValue()
abstract class BanUserRequest
    implements Built<BanUserRequest, BanUserRequestBuilder> {
  @BuiltValueField(wireName: r'ttlSeconds')
  int? get ttlSeconds;

  BanUserRequest._();

  factory BanUserRequest([void updates(BanUserRequestBuilder b)]) =
      _$BanUserRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BanUserRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BanUserRequest> get serializer =>
      _$BanUserRequestSerializer();
}

class _$BanUserRequestSerializer
    implements PrimitiveSerializer<BanUserRequest> {
  @override
  final Iterable<Type> types = const [BanUserRequest, _$BanUserRequest];

  @override
  final String wireName = r'BanUserRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BanUserRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.ttlSeconds != null) {
      yield r'ttlSeconds';
      yield serializers.serialize(
        object.ttlSeconds,
        specifiedType: const FullType(int),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    BanUserRequest object, {
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
    required BanUserRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ttlSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.ttlSeconds = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BanUserRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BanUserRequestBuilder();
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
