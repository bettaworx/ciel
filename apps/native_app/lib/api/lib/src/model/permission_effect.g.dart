// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'permission_effect.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const PermissionEffect _$allow = const PermissionEffect._('allow');
const PermissionEffect _$deny = const PermissionEffect._('deny');

PermissionEffect _$valueOf(String name) {
  switch (name) {
    case 'allow':
      return _$allow;
    case 'deny':
      return _$deny;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<PermissionEffect> _$values =
    BuiltSet<PermissionEffect>(const <PermissionEffect>[
  _$allow,
  _$deny,
]);

class _$PermissionEffectMeta {
  const _$PermissionEffectMeta();
  PermissionEffect get allow => _$allow;
  PermissionEffect get deny => _$deny;
  PermissionEffect valueOf(String name) => _$valueOf(name);
  BuiltSet<PermissionEffect> get values => _$values;
}

abstract class _$PermissionEffectMixin {
  // ignore: non_constant_identifier_names
  _$PermissionEffectMeta get PermissionEffect => const _$PermissionEffectMeta();
}

Serializer<PermissionEffect> _$permissionEffectSerializer =
    _$PermissionEffectSerializer();

class _$PermissionEffectSerializer
    implements PrimitiveSerializer<PermissionEffect> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'allow': 'allow',
    'deny': 'deny',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'allow': 'allow',
    'deny': 'deny',
  };

  @override
  final Iterable<Type> types = const <Type>[PermissionEffect];
  @override
  final String wireName = 'PermissionEffect';

  @override
  Object serialize(Serializers serializers, PermissionEffect object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  PermissionEffect deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      PermissionEffect.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
