//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'permission_effect.g.dart';

class PermissionEffect extends EnumClass {
  @BuiltValueEnumConst(wireName: r'allow')
  static const PermissionEffect allow = _$allow;
  @BuiltValueEnumConst(wireName: r'deny')
  static const PermissionEffect deny = _$deny;

  static Serializer<PermissionEffect> get serializer =>
      _$permissionEffectSerializer;

  const PermissionEffect._(String name) : super(name);

  static BuiltSet<PermissionEffect> get values => _$values;
  static PermissionEffect valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class PermissionEffectMixin = Object with _$PermissionEffectMixin;
