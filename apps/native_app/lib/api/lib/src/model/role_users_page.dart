//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/role_user.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'role_users_page.g.dart';

/// RoleUsersPage
///
/// Properties:
/// * [roleId]
/// * [users]
/// * [total] - Total number of users with this role
@BuiltValue()
abstract class RoleUsersPage
    implements Built<RoleUsersPage, RoleUsersPageBuilder> {
  @BuiltValueField(wireName: r'roleId')
  String get roleId;

  @BuiltValueField(wireName: r'users')
  BuiltList<RoleUser> get users;

  /// Total number of users with this role
  @BuiltValueField(wireName: r'total')
  int get total;

  RoleUsersPage._();

  factory RoleUsersPage([void updates(RoleUsersPageBuilder b)]) =
      _$RoleUsersPage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RoleUsersPageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RoleUsersPage> get serializer =>
      _$RoleUsersPageSerializer();
}

class _$RoleUsersPageSerializer implements PrimitiveSerializer<RoleUsersPage> {
  @override
  final Iterable<Type> types = const [RoleUsersPage, _$RoleUsersPage];

  @override
  final String wireName = r'RoleUsersPage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RoleUsersPage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'roleId';
    yield serializers.serialize(
      object.roleId,
      specifiedType: const FullType(String),
    );
    yield r'users';
    yield serializers.serialize(
      object.users,
      specifiedType: const FullType(BuiltList, [FullType(RoleUser)]),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RoleUsersPage object, {
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
    required RoleUsersPageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'roleId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.roleId = valueDes;
          break;
        case r'users':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(RoleUser)]),
          ) as BuiltList<RoleUser>;
          result.users.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RoleUsersPage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RoleUsersPageBuilder();
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
