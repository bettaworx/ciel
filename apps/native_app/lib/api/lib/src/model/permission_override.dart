//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/permission_effect.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'permission_override.g.dart';

/// PermissionOverride
///
/// Properties:
/// * [permissionId]
/// * [scope]
/// * [effect]
@BuiltValue()
abstract class PermissionOverride
    implements Built<PermissionOverride, PermissionOverrideBuilder> {
  @BuiltValueField(wireName: r'permissionId')
  String get permissionId;

  @BuiltValueField(wireName: r'scope')
  String get scope;

  @BuiltValueField(wireName: r'effect')
  PermissionEffect get effect;
  // enum effectEnum {  allow,  deny,  };

  PermissionOverride._();

  factory PermissionOverride([void updates(PermissionOverrideBuilder b)]) =
      _$PermissionOverride;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PermissionOverrideBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PermissionOverride> get serializer =>
      _$PermissionOverrideSerializer();
}

class _$PermissionOverrideSerializer
    implements PrimitiveSerializer<PermissionOverride> {
  @override
  final Iterable<Type> types = const [PermissionOverride, _$PermissionOverride];

  @override
  final String wireName = r'PermissionOverride';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PermissionOverride object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'permissionId';
    yield serializers.serialize(
      object.permissionId,
      specifiedType: const FullType(String),
    );
    yield r'scope';
    yield serializers.serialize(
      object.scope,
      specifiedType: const FullType(String),
    );
    yield r'effect';
    yield serializers.serialize(
      object.effect,
      specifiedType: const FullType(PermissionEffect),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PermissionOverride object, {
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
    required PermissionOverrideBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'permissionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.permissionId = valueDes;
          break;
        case r'scope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.scope = valueDes;
          break;
        case r'effect':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PermissionEffect),
          ) as PermissionEffect;
          result.effect = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PermissionOverride deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PermissionOverrideBuilder();
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
