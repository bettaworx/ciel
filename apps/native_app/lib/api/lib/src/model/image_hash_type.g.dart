// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'image_hash_type.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ImageHashType _$phash = const ImageHashType._('phash');
const ImageHashType _$md5 = const ImageHashType._('md5');

ImageHashType _$valueOf(String name) {
  switch (name) {
    case 'phash':
      return _$phash;
    case 'md5':
      return _$md5;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ImageHashType> _$values =
    BuiltSet<ImageHashType>(const <ImageHashType>[
  _$phash,
  _$md5,
]);

class _$ImageHashTypeMeta {
  const _$ImageHashTypeMeta();
  ImageHashType get phash => _$phash;
  ImageHashType get md5 => _$md5;
  ImageHashType valueOf(String name) => _$valueOf(name);
  BuiltSet<ImageHashType> get values => _$values;
}

abstract class _$ImageHashTypeMixin {
  // ignore: non_constant_identifier_names
  _$ImageHashTypeMeta get ImageHashType => const _$ImageHashTypeMeta();
}

Serializer<ImageHashType> _$imageHashTypeSerializer =
    _$ImageHashTypeSerializer();

class _$ImageHashTypeSerializer implements PrimitiveSerializer<ImageHashType> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'phash': 'phash',
    'md5': 'md5',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'phash': 'phash',
    'md5': 'md5',
  };

  @override
  final Iterable<Type> types = const <Type>[ImageHashType];
  @override
  final String wireName = 'ImageHashType';

  @override
  Object serialize(Serializers serializers, ImageHashType object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ImageHashType deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ImageHashType.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
