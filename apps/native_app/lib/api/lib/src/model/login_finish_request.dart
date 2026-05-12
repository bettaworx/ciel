//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'login_finish_request.g.dart';

/// LoginFinishRequest
///
/// Properties:
/// * [loginSessionId]
/// * [clientFinalNonce] - Typically clientNonce + serverNonce.
/// * [clientProof] - Base64-encoded proof computed by the client.
@BuiltValue()
abstract class LoginFinishRequest
    implements Built<LoginFinishRequest, LoginFinishRequestBuilder> {
  @BuiltValueField(wireName: r'loginSessionId')
  String get loginSessionId;

  /// Typically clientNonce + serverNonce.
  @BuiltValueField(wireName: r'clientFinalNonce')
  String get clientFinalNonce;

  /// Base64-encoded proof computed by the client.
  @BuiltValueField(wireName: r'clientProof')
  String get clientProof;

  LoginFinishRequest._();

  factory LoginFinishRequest([void updates(LoginFinishRequestBuilder b)]) =
      _$LoginFinishRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LoginFinishRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LoginFinishRequest> get serializer =>
      _$LoginFinishRequestSerializer();
}

class _$LoginFinishRequestSerializer
    implements PrimitiveSerializer<LoginFinishRequest> {
  @override
  final Iterable<Type> types = const [LoginFinishRequest, _$LoginFinishRequest];

  @override
  final String wireName = r'LoginFinishRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LoginFinishRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'loginSessionId';
    yield serializers.serialize(
      object.loginSessionId,
      specifiedType: const FullType(String),
    );
    yield r'clientFinalNonce';
    yield serializers.serialize(
      object.clientFinalNonce,
      specifiedType: const FullType(String),
    );
    yield r'clientProof';
    yield serializers.serialize(
      object.clientProof,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LoginFinishRequest object, {
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
    required LoginFinishRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'loginSessionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.loginSessionId = valueDes;
          break;
        case r'clientFinalNonce':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientFinalNonce = valueDes;
          break;
        case r'clientProof':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientProof = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LoginFinishRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LoginFinishRequestBuilder();
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
