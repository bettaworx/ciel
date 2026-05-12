//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'register_request.g.dart';

/// RegisterRequest
///
/// Properties:
/// * [username]
/// * [password]
/// * [termsVersion] - Version of Terms of Service being accepted
/// * [privacyVersion] - Version of Privacy Policy being accepted
/// * [inviteCode] - Required when server is in invite-only mode
@BuiltValue()
abstract class RegisterRequest
    implements Built<RegisterRequest, RegisterRequestBuilder> {
  @BuiltValueField(wireName: r'username')
  String get username;

  @BuiltValueField(wireName: r'password')
  String get password;

  /// Version of Terms of Service being accepted
  @BuiltValueField(wireName: r'termsVersion')
  int get termsVersion;

  /// Version of Privacy Policy being accepted
  @BuiltValueField(wireName: r'privacyVersion')
  int get privacyVersion;

  /// Required when server is in invite-only mode
  @BuiltValueField(wireName: r'inviteCode')
  String? get inviteCode;

  RegisterRequest._();

  factory RegisterRequest([void updates(RegisterRequestBuilder b)]) =
      _$RegisterRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RegisterRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RegisterRequest> get serializer =>
      _$RegisterRequestSerializer();
}

class _$RegisterRequestSerializer
    implements PrimitiveSerializer<RegisterRequest> {
  @override
  final Iterable<Type> types = const [RegisterRequest, _$RegisterRequest];

  @override
  final String wireName = r'RegisterRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RegisterRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'username';
    yield serializers.serialize(
      object.username,
      specifiedType: const FullType(String),
    );
    yield r'password';
    yield serializers.serialize(
      object.password,
      specifiedType: const FullType(String),
    );
    yield r'termsVersion';
    yield serializers.serialize(
      object.termsVersion,
      specifiedType: const FullType(int),
    );
    yield r'privacyVersion';
    yield serializers.serialize(
      object.privacyVersion,
      specifiedType: const FullType(int),
    );
    if (object.inviteCode != null) {
      yield r'inviteCode';
      yield serializers.serialize(
        object.inviteCode,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    RegisterRequest object, {
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
    required RegisterRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'username':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.username = valueDes;
          break;
        case r'password':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.password = valueDes;
          break;
        case r'termsVersion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.termsVersion = valueDes;
          break;
        case r'privacyVersion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.privacyVersion = valueDes;
          break;
        case r'inviteCode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.inviteCode = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RegisterRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RegisterRequestBuilder();
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
