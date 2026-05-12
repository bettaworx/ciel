//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'login_start_response.g.dart';

/// LoginStartResponse
///
/// Properties:
/// * [loginSessionId]
/// * [salt] - Base64-encoded salt.
/// * [iterations] - PBKDF2 iteration count.
/// * [serverNonce] - Server-provided nonce to append to clientNonce.
/// * [expiresInSeconds]
@BuiltValue()
abstract class LoginStartResponse
    implements Built<LoginStartResponse, LoginStartResponseBuilder> {
  @BuiltValueField(wireName: r'loginSessionId')
  String get loginSessionId;

  /// Base64-encoded salt.
  @BuiltValueField(wireName: r'salt')
  String get salt;

  /// PBKDF2 iteration count.
  @BuiltValueField(wireName: r'iterations')
  int get iterations;

  /// Server-provided nonce to append to clientNonce.
  @BuiltValueField(wireName: r'serverNonce')
  String get serverNonce;

  @BuiltValueField(wireName: r'expiresInSeconds')
  int get expiresInSeconds;

  LoginStartResponse._();

  factory LoginStartResponse([void updates(LoginStartResponseBuilder b)]) =
      _$LoginStartResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LoginStartResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LoginStartResponse> get serializer =>
      _$LoginStartResponseSerializer();
}

class _$LoginStartResponseSerializer
    implements PrimitiveSerializer<LoginStartResponse> {
  @override
  final Iterable<Type> types = const [LoginStartResponse, _$LoginStartResponse];

  @override
  final String wireName = r'LoginStartResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LoginStartResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'loginSessionId';
    yield serializers.serialize(
      object.loginSessionId,
      specifiedType: const FullType(String),
    );
    yield r'salt';
    yield serializers.serialize(
      object.salt,
      specifiedType: const FullType(String),
    );
    yield r'iterations';
    yield serializers.serialize(
      object.iterations,
      specifiedType: const FullType(int),
    );
    yield r'serverNonce';
    yield serializers.serialize(
      object.serverNonce,
      specifiedType: const FullType(String),
    );
    yield r'expiresInSeconds';
    yield serializers.serialize(
      object.expiresInSeconds,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LoginStartResponse object, {
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
    required LoginStartResponseBuilder result,
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
        case r'salt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.salt = valueDes;
          break;
        case r'iterations':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.iterations = valueDes;
          break;
        case r'serverNonce':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.serverNonce = valueDes;
          break;
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
  LoginStartResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LoginStartResponseBuilder();
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
