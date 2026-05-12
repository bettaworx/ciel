// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'banned_word_severity.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const BannedWordSeverity _$flag = const BannedWordSeverity._('flag');
const BannedWordSeverity _$autoDelete =
    const BannedWordSeverity._('autoDelete');

BannedWordSeverity _$valueOf(String name) {
  switch (name) {
    case 'flag':
      return _$flag;
    case 'autoDelete':
      return _$autoDelete;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<BannedWordSeverity> _$values =
    BuiltSet<BannedWordSeverity>(const <BannedWordSeverity>[
  _$flag,
  _$autoDelete,
]);

class _$BannedWordSeverityMeta {
  const _$BannedWordSeverityMeta();
  BannedWordSeverity get flag => _$flag;
  BannedWordSeverity get autoDelete => _$autoDelete;
  BannedWordSeverity valueOf(String name) => _$valueOf(name);
  BuiltSet<BannedWordSeverity> get values => _$values;
}

abstract class _$BannedWordSeverityMixin {
  // ignore: non_constant_identifier_names
  _$BannedWordSeverityMeta get BannedWordSeverity =>
      const _$BannedWordSeverityMeta();
}

Serializer<BannedWordSeverity> _$bannedWordSeveritySerializer =
    _$BannedWordSeveritySerializer();

class _$BannedWordSeveritySerializer
    implements PrimitiveSerializer<BannedWordSeverity> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'flag': 'flag',
    'autoDelete': 'auto_delete',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'flag': 'flag',
    'auto_delete': 'autoDelete',
  };

  @override
  final Iterable<Type> types = const <Type>[BannedWordSeverity];
  @override
  final String wireName = 'BannedWordSeverity';

  @override
  Object serialize(Serializers serializers, BannedWordSeverity object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  BannedWordSeverity deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      BannedWordSeverity.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
