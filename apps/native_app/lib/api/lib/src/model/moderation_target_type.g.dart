// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'moderation_target_type.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ModerationTargetType _$user = const ModerationTargetType._('user');
const ModerationTargetType _$post = const ModerationTargetType._('post');
const ModerationTargetType _$media = const ModerationTargetType._('media');
const ModerationTargetType _$report = const ModerationTargetType._('report');
const ModerationTargetType _$ip = const ModerationTargetType._('ip');
const ModerationTargetType _$word = const ModerationTargetType._('word');
const ModerationTargetType _$image = const ModerationTargetType._('image');
const ModerationTargetType _$agreement =
    const ModerationTargetType._('agreement');
const ModerationTargetType _$other = const ModerationTargetType._('other');

ModerationTargetType _$valueOf(String name) {
  switch (name) {
    case 'user':
      return _$user;
    case 'post':
      return _$post;
    case 'media':
      return _$media;
    case 'report':
      return _$report;
    case 'ip':
      return _$ip;
    case 'word':
      return _$word;
    case 'image':
      return _$image;
    case 'agreement':
      return _$agreement;
    case 'other':
      return _$other;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ModerationTargetType> _$values =
    BuiltSet<ModerationTargetType>(const <ModerationTargetType>[
  _$user,
  _$post,
  _$media,
  _$report,
  _$ip,
  _$word,
  _$image,
  _$agreement,
  _$other,
]);

class _$ModerationTargetTypeMeta {
  const _$ModerationTargetTypeMeta();
  ModerationTargetType get user => _$user;
  ModerationTargetType get post => _$post;
  ModerationTargetType get media => _$media;
  ModerationTargetType get report => _$report;
  ModerationTargetType get ip => _$ip;
  ModerationTargetType get word => _$word;
  ModerationTargetType get image => _$image;
  ModerationTargetType get agreement => _$agreement;
  ModerationTargetType get other => _$other;
  ModerationTargetType valueOf(String name) => _$valueOf(name);
  BuiltSet<ModerationTargetType> get values => _$values;
}

abstract class _$ModerationTargetTypeMixin {
  // ignore: non_constant_identifier_names
  _$ModerationTargetTypeMeta get ModerationTargetType =>
      const _$ModerationTargetTypeMeta();
}

Serializer<ModerationTargetType> _$moderationTargetTypeSerializer =
    _$ModerationTargetTypeSerializer();

class _$ModerationTargetTypeSerializer
    implements PrimitiveSerializer<ModerationTargetType> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'user': 'user',
    'post': 'post',
    'media': 'media',
    'report': 'report',
    'ip': 'ip',
    'word': 'word',
    'image': 'image',
    'agreement': 'agreement',
    'other': 'other',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'user': 'user',
    'post': 'post',
    'media': 'media',
    'report': 'report',
    'ip': 'ip',
    'word': 'word',
    'image': 'image',
    'agreement': 'agreement',
    'other': 'other',
  };

  @override
  final Iterable<Type> types = const <Type>[ModerationTargetType];
  @override
  final String wireName = 'ModerationTargetType';

  @override
  Object serialize(Serializers serializers, ModerationTargetType object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ModerationTargetType deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ModerationTargetType.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
