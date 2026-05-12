//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_roles_update_request.g.dart';

/// UserRolesUpdateRequest
///
/// Properties:
/// * [roles]
@BuiltValue()
abstract class UserRolesUpdateRequest
    implements Built<UserRolesUpdateRequest, UserRolesUpdateRequestBuilder> {
  @BuiltValueField(wireName: r'roles')
  BuiltList<String> get roles;

  UserRolesUpdateRequest._();

  factory UserRolesUpdateRequest(
          [void updates(UserRolesUpdateRequestBuilder b)]) =
      _$UserRolesUpdateRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserRolesUpdateRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserRolesUpdateRequest> get serializer =>
      _$UserRolesUpdateRequestSerializer();
}

class _$UserRolesUpdateRequestSerializer
    implements PrimitiveSerializer<UserRolesUpdateRequest> {
  @override
  final Iterable<Type> types = const [
    UserRolesUpdateRequest,
    _$UserRolesUpdateRequest
  ];

  @override
  final String wireName = r'UserRolesUpdateRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserRolesUpdateRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'roles';
    yield serializers.serialize(
      object.roles,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UserRolesUpdateRequest object, {
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
    required UserRolesUpdateRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'roles':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.roles.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserRolesUpdateRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserRolesUpdateRequestBuilder();
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
