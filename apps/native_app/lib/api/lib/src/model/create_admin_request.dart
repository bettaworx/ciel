//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_admin_request.g.dart';

/// CreateAdminRequest
///
/// Properties:
/// * [setupToken] - Temporary token obtained from verify-password endpoint
/// * [username]
/// * [password]
@BuiltValue()
abstract class CreateAdminRequest
    implements Built<CreateAdminRequest, CreateAdminRequestBuilder> {
  /// Temporary token obtained from verify-password endpoint
  @BuiltValueField(wireName: r'setupToken')
  String get setupToken;

  @BuiltValueField(wireName: r'username')
  String get username;

  @BuiltValueField(wireName: r'password')
  String get password;

  CreateAdminRequest._();

  factory CreateAdminRequest([void updates(CreateAdminRequestBuilder b)]) =
      _$CreateAdminRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateAdminRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateAdminRequest> get serializer =>
      _$CreateAdminRequestSerializer();
}

class _$CreateAdminRequestSerializer
    implements PrimitiveSerializer<CreateAdminRequest> {
  @override
  final Iterable<Type> types = const [CreateAdminRequest, _$CreateAdminRequest];

  @override
  final String wireName = r'CreateAdminRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateAdminRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'setupToken';
    yield serializers.serialize(
      object.setupToken,
      specifiedType: const FullType(String),
    );
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
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateAdminRequest object, {
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
    required CreateAdminRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'setupToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.setupToken = valueDes;
          break;
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateAdminRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateAdminRequestBuilder();
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
