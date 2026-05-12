//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/user.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'login_finish_response.g.dart';

/// LoginFinishResponse
///
/// Properties:
/// * [accessToken]
/// * [tokenType]
/// * [expiresInSeconds]
/// * [user]
@BuiltValue()
abstract class LoginFinishResponse
    implements Built<LoginFinishResponse, LoginFinishResponseBuilder> {
  @BuiltValueField(wireName: r'accessToken')
  String get accessToken;

  @BuiltValueField(wireName: r'tokenType')
  LoginFinishResponseTokenTypeEnum get tokenType;
  // enum tokenTypeEnum {  Bearer,  };

  @BuiltValueField(wireName: r'expiresInSeconds')
  int get expiresInSeconds;

  @BuiltValueField(wireName: r'user')
  User get user;

  LoginFinishResponse._();

  factory LoginFinishResponse([void updates(LoginFinishResponseBuilder b)]) =
      _$LoginFinishResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LoginFinishResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LoginFinishResponse> get serializer =>
      _$LoginFinishResponseSerializer();
}

class _$LoginFinishResponseSerializer
    implements PrimitiveSerializer<LoginFinishResponse> {
  @override
  final Iterable<Type> types = const [
    LoginFinishResponse,
    _$LoginFinishResponse
  ];

  @override
  final String wireName = r'LoginFinishResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LoginFinishResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'accessToken';
    yield serializers.serialize(
      object.accessToken,
      specifiedType: const FullType(String),
    );
    yield r'tokenType';
    yield serializers.serialize(
      object.tokenType,
      specifiedType: const FullType(LoginFinishResponseTokenTypeEnum),
    );
    yield r'expiresInSeconds';
    yield serializers.serialize(
      object.expiresInSeconds,
      specifiedType: const FullType(int),
    );
    yield r'user';
    yield serializers.serialize(
      object.user,
      specifiedType: const FullType(User),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LoginFinishResponse object, {
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
    required LoginFinishResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'accessToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.accessToken = valueDes;
          break;
        case r'tokenType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LoginFinishResponseTokenTypeEnum),
          ) as LoginFinishResponseTokenTypeEnum;
          result.tokenType = valueDes;
          break;
        case r'expiresInSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.expiresInSeconds = valueDes;
          break;
        case r'user':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(User),
          ) as User;
          result.user = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LoginFinishResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LoginFinishResponseBuilder();
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

class LoginFinishResponseTokenTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'Bearer')
  static const LoginFinishResponseTokenTypeEnum bearer =
      _$loginFinishResponseTokenTypeEnum_bearer;

  static Serializer<LoginFinishResponseTokenTypeEnum> get serializer =>
      _$loginFinishResponseTokenTypeEnumSerializer;

  const LoginFinishResponseTokenTypeEnum._(String name) : super(name);

  static BuiltSet<LoginFinishResponseTokenTypeEnum> get values =>
      _$loginFinishResponseTokenTypeEnumValues;
  static LoginFinishResponseTokenTypeEnum valueOf(String name) =>
      _$loginFinishResponseTokenTypeEnumValueOf(name);
}
