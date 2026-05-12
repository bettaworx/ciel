// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mute_type.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const MuteType _$postsCreate = const MuteType._('postsCreate');
const MuteType _$mediaUpload = const MuteType._('mediaUpload');
const MuteType _$reactionsAdd = const MuteType._('reactionsAdd');
const MuteType _$all = const MuteType._('all');

MuteType _$valueOf(String name) {
  switch (name) {
    case 'postsCreate':
      return _$postsCreate;
    case 'mediaUpload':
      return _$mediaUpload;
    case 'reactionsAdd':
      return _$reactionsAdd;
    case 'all':
      return _$all;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<MuteType> _$values = BuiltSet<MuteType>(const <MuteType>[
  _$postsCreate,
  _$mediaUpload,
  _$reactionsAdd,
  _$all,
]);

class _$MuteTypeMeta {
  const _$MuteTypeMeta();
  MuteType get postsCreate => _$postsCreate;
  MuteType get mediaUpload => _$mediaUpload;
  MuteType get reactionsAdd => _$reactionsAdd;
  MuteType get all => _$all;
  MuteType valueOf(String name) => _$valueOf(name);
  BuiltSet<MuteType> get values => _$values;
}

abstract class _$MuteTypeMixin {
  // ignore: non_constant_identifier_names
  _$MuteTypeMeta get MuteType => const _$MuteTypeMeta();
}

Serializer<MuteType> _$muteTypeSerializer = _$MuteTypeSerializer();

class _$MuteTypeSerializer implements PrimitiveSerializer<MuteType> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'postsCreate': 'posts_create',
    'mediaUpload': 'media_upload',
    'reactionsAdd': 'reactions_add',
    'all': 'all',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'posts_create': 'postsCreate',
    'media_upload': 'mediaUpload',
    'reactions_add': 'reactionsAdd',
    'all': 'all',
  };

  @override
  final Iterable<Type> types = const <Type>[MuteType];
  @override
  final String wireName = 'MuteType';

  @override
  Object serialize(Serializers serializers, MuteType object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  MuteType deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      MuteType.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
