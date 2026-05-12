// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'banned_word_applies_to.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const BannedWordAppliesTo _$posts = const BannedWordAppliesTo._('posts');
const BannedWordAppliesTo _$profiles = const BannedWordAppliesTo._('profiles');
const BannedWordAppliesTo _$all = const BannedWordAppliesTo._('all');

BannedWordAppliesTo _$valueOf(String name) {
  switch (name) {
    case 'posts':
      return _$posts;
    case 'profiles':
      return _$profiles;
    case 'all':
      return _$all;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<BannedWordAppliesTo> _$values =
    BuiltSet<BannedWordAppliesTo>(const <BannedWordAppliesTo>[
  _$posts,
  _$profiles,
  _$all,
]);

class _$BannedWordAppliesToMeta {
  const _$BannedWordAppliesToMeta();
  BannedWordAppliesTo get posts => _$posts;
  BannedWordAppliesTo get profiles => _$profiles;
  BannedWordAppliesTo get all => _$all;
  BannedWordAppliesTo valueOf(String name) => _$valueOf(name);
  BuiltSet<BannedWordAppliesTo> get values => _$values;
}

abstract class _$BannedWordAppliesToMixin {
  // ignore: non_constant_identifier_names
  _$BannedWordAppliesToMeta get BannedWordAppliesTo =>
      const _$BannedWordAppliesToMeta();
}

Serializer<BannedWordAppliesTo> _$bannedWordAppliesToSerializer =
    _$BannedWordAppliesToSerializer();

class _$BannedWordAppliesToSerializer
    implements PrimitiveSerializer<BannedWordAppliesTo> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'posts': 'posts',
    'profiles': 'profiles',
    'all': 'all',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'posts': 'posts',
    'profiles': 'profiles',
    'all': 'all',
  };

  @override
  final Iterable<Type> types = const <Type>[BannedWordAppliesTo];
  @override
  final String wireName = 'BannedWordAppliesTo';

  @override
  Object serialize(Serializers serializers, BannedWordAppliesTo object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  BannedWordAppliesTo deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      BannedWordAppliesTo.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
