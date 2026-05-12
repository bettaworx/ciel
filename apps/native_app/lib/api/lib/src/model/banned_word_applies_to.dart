//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'banned_word_applies_to.g.dart';

class BannedWordAppliesTo extends EnumClass {
  /// Where the banned word pattern applies
  @BuiltValueEnumConst(wireName: r'posts')
  static const BannedWordAppliesTo posts = _$posts;

  /// Where the banned word pattern applies
  @BuiltValueEnumConst(wireName: r'profiles')
  static const BannedWordAppliesTo profiles = _$profiles;

  /// Where the banned word pattern applies
  @BuiltValueEnumConst(wireName: r'all')
  static const BannedWordAppliesTo all = _$all;

  static Serializer<BannedWordAppliesTo> get serializer =>
      _$bannedWordAppliesToSerializer;

  const BannedWordAppliesTo._(String name) : super(name);

  static BuiltSet<BannedWordAppliesTo> get values => _$values;
  static BannedWordAppliesTo valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class BannedWordAppliesToMixin = Object
    with _$BannedWordAppliesToMixin;
