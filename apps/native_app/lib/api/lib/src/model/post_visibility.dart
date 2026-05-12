//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'post_visibility.g.dart';

class PostVisibility extends EnumClass {
  /// Visibility state of a post
  @BuiltValueEnumConst(wireName: r'public')
  static const PostVisibility public = _$public;

  /// Visibility state of a post
  @BuiltValueEnumConst(wireName: r'hidden')
  static const PostVisibility hidden = _$hidden;

  /// Visibility state of a post
  @BuiltValueEnumConst(wireName: r'deleted')
  static const PostVisibility deleted = _$deleted;

  static Serializer<PostVisibility> get serializer =>
      _$postVisibilitySerializer;

  const PostVisibility._(String name) : super(name);

  static BuiltSet<PostVisibility> get values => _$values;
  static PostVisibility valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class PostVisibilityMixin = Object with _$PostVisibilityMixin;
