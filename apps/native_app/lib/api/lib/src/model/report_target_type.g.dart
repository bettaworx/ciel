// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'report_target_type.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ReportTargetType _$user = const ReportTargetType._('user');
const ReportTargetType _$post = const ReportTargetType._('post');
const ReportTargetType _$media = const ReportTargetType._('media');

ReportTargetType _$valueOf(String name) {
  switch (name) {
    case 'user':
      return _$user;
    case 'post':
      return _$post;
    case 'media':
      return _$media;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ReportTargetType> _$values =
    BuiltSet<ReportTargetType>(const <ReportTargetType>[
  _$user,
  _$post,
  _$media,
]);

class _$ReportTargetTypeMeta {
  const _$ReportTargetTypeMeta();
  ReportTargetType get user => _$user;
  ReportTargetType get post => _$post;
  ReportTargetType get media => _$media;
  ReportTargetType valueOf(String name) => _$valueOf(name);
  BuiltSet<ReportTargetType> get values => _$values;
}

abstract class _$ReportTargetTypeMixin {
  // ignore: non_constant_identifier_names
  _$ReportTargetTypeMeta get ReportTargetType => const _$ReportTargetTypeMeta();
}

Serializer<ReportTargetType> _$reportTargetTypeSerializer =
    _$ReportTargetTypeSerializer();

class _$ReportTargetTypeSerializer
    implements PrimitiveSerializer<ReportTargetType> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'user': 'user',
    'post': 'post',
    'media': 'media',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'user': 'user',
    'post': 'post',
    'media': 'media',
  };

  @override
  final Iterable<Type> types = const <Type>[ReportTargetType];
  @override
  final String wireName = 'ReportTargetType';

  @override
  Object serialize(Serializers serializers, ReportTargetType object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ReportTargetType deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ReportTargetType.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
