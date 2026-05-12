// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post_visibility.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const PostVisibility _$public = const PostVisibility._('public');
const PostVisibility _$hidden = const PostVisibility._('hidden');
const PostVisibility _$deleted = const PostVisibility._('deleted');

PostVisibility _$valueOf(String name) {
  switch (name) {
    case 'public':
      return _$public;
    case 'hidden':
      return _$hidden;
    case 'deleted':
      return _$deleted;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<PostVisibility> _$values =
    BuiltSet<PostVisibility>(const <PostVisibility>[
  _$public,
  _$hidden,
  _$deleted,
]);

class _$PostVisibilityMeta {
  const _$PostVisibilityMeta();
  PostVisibility get public => _$public;
  PostVisibility get hidden => _$hidden;
  PostVisibility get deleted => _$deleted;
  PostVisibility valueOf(String name) => _$valueOf(name);
  BuiltSet<PostVisibility> get values => _$values;
}

abstract class _$PostVisibilityMixin {
  // ignore: non_constant_identifier_names
  _$PostVisibilityMeta get PostVisibility => const _$PostVisibilityMeta();
}

Serializer<PostVisibility> _$postVisibilitySerializer =
    _$PostVisibilitySerializer();

class _$PostVisibilitySerializer
    implements PrimitiveSerializer<PostVisibility> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'public': 'public',
    'hidden': 'hidden',
    'deleted': 'deleted',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'public': 'public',
    'hidden': 'hidden',
    'deleted': 'deleted',
  };

  @override
  final Iterable<Type> types = const <Type>[PostVisibility];
  @override
  final String wireName = 'PostVisibility';

  @override
  Object serialize(Serializers serializers, PostVisibility object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  PostVisibility deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      PostVisibility.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
