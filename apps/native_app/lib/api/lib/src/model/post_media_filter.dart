//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'post_media_filter.g.dart';

class PostMediaFilter extends EnumClass {
  @BuiltValueEnumConst(wireName: r'image')
  static const PostMediaFilter image = _$image;
  @BuiltValueEnumConst(wireName: r'video')
  static const PostMediaFilter video = _$video;
  @BuiltValueEnumConst(wireName: r'media')
  static const PostMediaFilter media = _$media;

  static Serializer<PostMediaFilter> get serializer =>
      _$postMediaFilterSerializer;

  const PostMediaFilter._(String name) : super(name);

  static BuiltSet<PostMediaFilter> get values => _$values;
  static PostMediaFilter valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class PostMediaFilterMixin = Object with _$PostMediaFilterMixin;
