//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/permission_override.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_permission_overrides.g.dart';

/// UserPermissionOverrides
///
/// Properties:
/// * [overrides]
@BuiltValue()
abstract class UserPermissionOverrides
    implements Built<UserPermissionOverrides, UserPermissionOverridesBuilder> {
  @BuiltValueField(wireName: r'overrides')
  BuiltList<PermissionOverride> get overrides;

  UserPermissionOverrides._();

  factory UserPermissionOverrides(
          [void updates(UserPermissionOverridesBuilder b)]) =
      _$UserPermissionOverrides;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserPermissionOverridesBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserPermissionOverrides> get serializer =>
      _$UserPermissionOverridesSerializer();
}

class _$UserPermissionOverridesSerializer
    implements PrimitiveSerializer<UserPermissionOverrides> {
  @override
  final Iterable<Type> types = const [
    UserPermissionOverrides,
    _$UserPermissionOverrides
  ];

  @override
  final String wireName = r'UserPermissionOverrides';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserPermissionOverrides object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'overrides';
    yield serializers.serialize(
      object.overrides,
      specifiedType: const FullType(BuiltList, [FullType(PermissionOverride)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UserPermissionOverrides object, {
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
    required UserPermissionOverridesBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'overrides':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(PermissionOverride)]),
          ) as BuiltList<PermissionOverride>;
          result.overrides.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserPermissionOverrides deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserPermissionOverridesBuilder();
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
