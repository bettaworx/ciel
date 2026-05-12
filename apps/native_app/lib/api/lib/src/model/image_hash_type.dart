//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'image_hash_type.g.dart';

class ImageHashType extends EnumClass {
  /// Type of image hash algorithm used
  @BuiltValueEnumConst(wireName: r'phash')
  static const ImageHashType phash = _$phash;

  /// Type of image hash algorithm used
  @BuiltValueEnumConst(wireName: r'md5')
  static const ImageHashType md5 = _$md5;

  static Serializer<ImageHashType> get serializer => _$imageHashTypeSerializer;

  const ImageHashType._(String name) : super(name);

  static BuiltSet<ImageHashType> get values => _$values;
  static ImageHashType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ImageHashTypeMixin = Object with _$ImageHashTypeMixin;
