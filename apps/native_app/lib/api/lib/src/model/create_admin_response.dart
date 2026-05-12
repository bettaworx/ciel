//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/user.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_admin_response.g.dart';

/// CreateAdminResponse
///
/// Properties:
/// * [user]
/// * [token]
@BuiltValue()
abstract class CreateAdminResponse
    implements Built<CreateAdminResponse, CreateAdminResponseBuilder> {
  @BuiltValueField(wireName: r'user')
  User get user;

  @BuiltValueField(wireName: r'token')
  String get token;

  CreateAdminResponse._();

  factory CreateAdminResponse([void updates(CreateAdminResponseBuilder b)]) =
      _$CreateAdminResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateAdminResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateAdminResponse> get serializer =>
      _$CreateAdminResponseSerializer();
}

class _$CreateAdminResponseSerializer
    implements PrimitiveSerializer<CreateAdminResponse> {
  @override
  final Iterable<Type> types = const [
    CreateAdminResponse,
    _$CreateAdminResponse
  ];

  @override
  final String wireName = r'CreateAdminResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateAdminResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'user';
    yield serializers.serialize(
      object.user,
      specifiedType: const FullType(User),
    );
    yield r'token';
    yield serializers.serialize(
      object.token,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateAdminResponse object, {
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
    required CreateAdminResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'user':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(User),
          ) as User;
          result.user = valueDes;
          break;
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.token = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateAdminResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateAdminResponseBuilder();
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
