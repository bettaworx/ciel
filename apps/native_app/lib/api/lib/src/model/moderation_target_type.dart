//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'moderation_target_type.g.dart';

class ModerationTargetType extends EnumClass {
  /// Type of target for moderation action
  @BuiltValueEnumConst(wireName: r'user')
  static const ModerationTargetType user = _$user;

  /// Type of target for moderation action
  @BuiltValueEnumConst(wireName: r'post')
  static const ModerationTargetType post = _$post;

  /// Type of target for moderation action
  @BuiltValueEnumConst(wireName: r'media')
  static const ModerationTargetType media = _$media;

  /// Type of target for moderation action
  @BuiltValueEnumConst(wireName: r'report')
  static const ModerationTargetType report = _$report;

  /// Type of target for moderation action
  @BuiltValueEnumConst(wireName: r'ip')
  static const ModerationTargetType ip = _$ip;

  /// Type of target for moderation action
  @BuiltValueEnumConst(wireName: r'word')
  static const ModerationTargetType word = _$word;

  /// Type of target for moderation action
  @BuiltValueEnumConst(wireName: r'image')
  static const ModerationTargetType image = _$image;

  /// Type of target for moderation action
  @BuiltValueEnumConst(wireName: r'agreement')
  static const ModerationTargetType agreement = _$agreement;

  /// Type of target for moderation action
  @BuiltValueEnumConst(wireName: r'other')
  static const ModerationTargetType other = _$other;

  static Serializer<ModerationTargetType> get serializer =>
      _$moderationTargetTypeSerializer;

  const ModerationTargetType._(String name) : super(name);

  static BuiltSet<ModerationTargetType> get values => _$values;
  static ModerationTargetType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ModerationTargetTypeMixin = Object
    with _$ModerationTargetTypeMixin;
