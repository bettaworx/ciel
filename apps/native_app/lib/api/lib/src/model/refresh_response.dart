//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'refresh_response.g.dart';

/// RefreshResponse
///
/// Properties:
/// * [expiresInSeconds] - Lifetime of the newly issued access token in seconds.
@BuiltValue()
abstract class RefreshResponse
    implements Built<RefreshResponse, RefreshResponseBuilder> {
  /// Lifetime of the newly issued access token in seconds.
  @BuiltValueField(wireName: r'expiresInSeconds')
  int get expiresInSeconds;

  RefreshResponse._();

  factory RefreshResponse([void updates(RefreshResponseBuilder b)]) =
      _$RefreshResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RefreshResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RefreshResponse> get serializer =>
      _$RefreshResponseSerializer();
}

class _$RefreshResponseSerializer
    implements PrimitiveSerializer<RefreshResponse> {
  @override
  final Iterable<Type> types = const [RefreshResponse, _$RefreshResponse];

  @override
  final String wireName = r'RefreshResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RefreshResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'expiresInSeconds';
    yield serializers.serialize(
      object.expiresInSeconds,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RefreshResponse object, {
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
    required RefreshResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'expiresInSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.expiresInSeconds = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RefreshResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RefreshResponseBuilder();
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
