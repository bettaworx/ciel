// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_type.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const MediaType _$image = const MediaType._('image');
const MediaType _$video = const MediaType._('video');

MediaType _$valueOf(String name) {
  switch (name) {
    case 'image':
      return _$image;
    case 'video':
      return _$video;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<MediaType> _$values = BuiltSet<MediaType>(const <MediaType>[
  _$image,
  _$video,
]);

class _$MediaTypeMeta {
  const _$MediaTypeMeta();
  MediaType get image => _$image;
  MediaType get video => _$video;
  MediaType valueOf(String name) => _$valueOf(name);
  BuiltSet<MediaType> get values => _$values;
}

abstract class _$MediaTypeMixin {
  // ignore: non_constant_identifier_names
  _$MediaTypeMeta get MediaType => const _$MediaTypeMeta();
}

Serializer<MediaType> _$mediaTypeSerializer = _$MediaTypeSerializer();

class _$MediaTypeSerializer implements PrimitiveSerializer<MediaType> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'image': 'image',
    'video': 'video',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'image': 'image',
    'video': 'video',
  };

  @override
  final Iterable<Type> types = const <Type>[MediaType];
  @override
  final String wireName = 'MediaType';

  @override
  Object serialize(Serializers serializers, MediaType object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  MediaType deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      MediaType.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
