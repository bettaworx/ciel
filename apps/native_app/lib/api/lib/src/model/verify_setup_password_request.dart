//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'verify_setup_password_request.g.dart';

/// VerifySetupPasswordRequest
///
/// Properties:
/// * [password]
@BuiltValue()
abstract class VerifySetupPasswordRequest
    implements
        Built<VerifySetupPasswordRequest, VerifySetupPasswordRequestBuilder> {
  @BuiltValueField(wireName: r'password')
  String get password;

  VerifySetupPasswordRequest._();

  factory VerifySetupPasswordRequest(
          [void updates(VerifySetupPasswordRequestBuilder b)]) =
      _$VerifySetupPasswordRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(VerifySetupPasswordRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<VerifySetupPasswordRequest> get serializer =>
      _$VerifySetupPasswordRequestSerializer();
}

class _$VerifySetupPasswordRequestSerializer
    implements PrimitiveSerializer<VerifySetupPasswordRequest> {
  @override
  final Iterable<Type> types = const [
    VerifySetupPasswordRequest,
    _$VerifySetupPasswordRequest
  ];

  @override
  final String wireName = r'VerifySetupPasswordRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    VerifySetupPasswordRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'password';
    yield serializers.serialize(
      object.password,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    VerifySetupPasswordRequest object, {
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
    required VerifySetupPasswordRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'password':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.password = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  VerifySetupPasswordRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = VerifySetupPasswordRequestBuilder();
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
