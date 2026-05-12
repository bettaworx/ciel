//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mute_type.g.dart';

class MuteType extends EnumClass {
  /// Type of user mute restriction
  @BuiltValueEnumConst(wireName: r'posts_create')
  static const MuteType postsCreate = _$postsCreate;

  /// Type of user mute restriction
  @BuiltValueEnumConst(wireName: r'media_upload')
  static const MuteType mediaUpload = _$mediaUpload;

  /// Type of user mute restriction
  @BuiltValueEnumConst(wireName: r'reactions_add')
  static const MuteType reactionsAdd = _$reactionsAdd;

  /// Type of user mute restriction
  @BuiltValueEnumConst(wireName: r'all')
  static const MuteType all = _$all;

  static Serializer<MuteType> get serializer => _$muteTypeSerializer;

  const MuteType._(String name) : super(name);

  static BuiltSet<MuteType> get values => _$values;
  static MuteType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class MuteTypeMixin = Object with _$MuteTypeMixin;
