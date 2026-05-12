// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post_media_filter.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const PostMediaFilter _$image = const PostMediaFilter._('image');
const PostMediaFilter _$video = const PostMediaFilter._('video');
const PostMediaFilter _$media = const PostMediaFilter._('media');

PostMediaFilter _$valueOf(String name) {
  switch (name) {
    case 'image':
      return _$image;
    case 'video':
      return _$video;
    case 'media':
      return _$media;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<PostMediaFilter> _$values =
    BuiltSet<PostMediaFilter>(const <PostMediaFilter>[
  _$image,
  _$video,
  _$media,
]);

class _$PostMediaFilterMeta {
  const _$PostMediaFilterMeta();
  PostMediaFilter get image => _$image;
  PostMediaFilter get video => _$video;
  PostMediaFilter get media => _$media;
  PostMediaFilter valueOf(String name) => _$valueOf(name);
  BuiltSet<PostMediaFilter> get values => _$values;
}

abstract class _$PostMediaFilterMixin {
  // ignore: non_constant_identifier_names
  _$PostMediaFilterMeta get PostMediaFilter => const _$PostMediaFilterMeta();
}

Serializer<PostMediaFilter> _$postMediaFilterSerializer =
    _$PostMediaFilterSerializer();

class _$PostMediaFilterSerializer
    implements PrimitiveSerializer<PostMediaFilter> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'image': 'image',
    'video': 'video',
    'media': 'media',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'image': 'image',
    'video': 'video',
    'media': 'media',
  };

  @override
  final Iterable<Type> types = const <Type>[PostMediaFilter];
  @override
  final String wireName = 'PostMediaFilter';

  @override
  Object serialize(Serializers serializers, PostMediaFilter object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  PostMediaFilter deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      PostMediaFilter.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
