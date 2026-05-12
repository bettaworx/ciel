//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'verify_setup_password_response.g.dart';

/// VerifySetupPasswordResponse
///
/// Properties:
/// * [valid] - Whether the password is valid
/// * [setupToken] - Temporary token for admin creation (valid for 10 minutes)
@BuiltValue()
abstract class VerifySetupPasswordResponse
    implements
        Built<VerifySetupPasswordResponse, VerifySetupPasswordResponseBuilder> {
  /// Whether the password is valid
  @BuiltValueField(wireName: r'valid')
  bool get valid;

  /// Temporary token for admin creation (valid for 10 minutes)
  @BuiltValueField(wireName: r'setupToken')
  String? get setupToken;

  VerifySetupPasswordResponse._();

  factory VerifySetupPasswordResponse(
          [void updates(VerifySetupPasswordResponseBuilder b)]) =
      _$VerifySetupPasswordResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(VerifySetupPasswordResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<VerifySetupPasswordResponse> get serializer =>
      _$VerifySetupPasswordResponseSerializer();
}

class _$VerifySetupPasswordResponseSerializer
    implements PrimitiveSerializer<VerifySetupPasswordResponse> {
  @override
  final Iterable<Type> types = const [
    VerifySetupPasswordResponse,
    _$VerifySetupPasswordResponse
  ];

  @override
  final String wireName = r'VerifySetupPasswordResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    VerifySetupPasswordResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'valid';
    yield serializers.serialize(
      object.valid,
      specifiedType: const FullType(bool),
    );
    if (object.setupToken != null) {
      yield r'setupToken';
      yield serializers.serialize(
        object.setupToken,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    VerifySetupPasswordResponse object, {
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
    required VerifySetupPasswordResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'valid':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.valid = valueDes;
          break;
        case r'setupToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.setupToken = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  VerifySetupPasswordResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = VerifySetupPasswordResponseBuilder();
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
