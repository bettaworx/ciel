//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/permission_override.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'role_permissions.g.dart';

/// RolePermissions
///
/// Properties:
/// * [roleId]
/// * [permissions]
@BuiltValue()
abstract class RolePermissions
    implements Built<RolePermissions, RolePermissionsBuilder> {
  @BuiltValueField(wireName: r'roleId')
  String get roleId;

  @BuiltValueField(wireName: r'permissions')
  BuiltList<PermissionOverride> get permissions;

  RolePermissions._();

  factory RolePermissions([void updates(RolePermissionsBuilder b)]) =
      _$RolePermissions;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RolePermissionsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RolePermissions> get serializer =>
      _$RolePermissionsSerializer();
}

class _$RolePermissionsSerializer
    implements PrimitiveSerializer<RolePermissions> {
  @override
  final Iterable<Type> types = const [RolePermissions, _$RolePermissions];

  @override
  final String wireName = r'RolePermissions';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RolePermissions object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'roleId';
    yield serializers.serialize(
      object.roleId,
      specifiedType: const FullType(String),
    );
    yield r'permissions';
    yield serializers.serialize(
      object.permissions,
      specifiedType: const FullType(BuiltList, [FullType(PermissionOverride)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RolePermissions object, {
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
    required RolePermissionsBuilder result,
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
        case r'permissions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(PermissionOverride)]),
          ) as BuiltList<PermissionOverride>;
          result.permissions.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RolePermissions deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RolePermissionsBuilder();
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
