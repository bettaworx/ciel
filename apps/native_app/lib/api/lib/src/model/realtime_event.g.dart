// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'realtime_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const RealtimeEventTypeEnum _$realtimeEventTypeEnum_postCreated =
    const RealtimeEventTypeEnum._('postCreated');
const RealtimeEventTypeEnum _$realtimeEventTypeEnum_postDeleted =
    const RealtimeEventTypeEnum._('postDeleted');
const RealtimeEventTypeEnum _$realtimeEventTypeEnum_reactionUpdated =
    const RealtimeEventTypeEnum._('reactionUpdated');
const RealtimeEventTypeEnum _$realtimeEventTypeEnum_userRegistered =
    const RealtimeEventTypeEnum._('userRegistered');
const RealtimeEventTypeEnum _$realtimeEventTypeEnum_userDeleted =
    const RealtimeEventTypeEnum._('userDeleted');
const RealtimeEventTypeEnum _$realtimeEventTypeEnum_serverInfoUpdated =
    const RealtimeEventTypeEnum._('serverInfoUpdated');
const RealtimeEventTypeEnum _$realtimeEventTypeEnum_serverConfigUpdated =
    const RealtimeEventTypeEnum._('serverConfigUpdated');

RealtimeEventTypeEnum _$realtimeEventTypeEnumValueOf(String name) {
  switch (name) {
    case 'postCreated':
      return _$realtimeEventTypeEnum_postCreated;
    case 'postDeleted':
      return _$realtimeEventTypeEnum_postDeleted;
    case 'reactionUpdated':
      return _$realtimeEventTypeEnum_reactionUpdated;
    case 'userRegistered':
      return _$realtimeEventTypeEnum_userRegistered;
    case 'userDeleted':
      return _$realtimeEventTypeEnum_userDeleted;
    case 'serverInfoUpdated':
      return _$realtimeEventTypeEnum_serverInfoUpdated;
    case 'serverConfigUpdated':
      return _$realtimeEventTypeEnum_serverConfigUpdated;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<RealtimeEventTypeEnum> _$realtimeEventTypeEnumValues =
    BuiltSet<RealtimeEventTypeEnum>(const <RealtimeEventTypeEnum>[
  _$realtimeEventTypeEnum_postCreated,
  _$realtimeEventTypeEnum_postDeleted,
  _$realtimeEventTypeEnum_reactionUpdated,
  _$realtimeEventTypeEnum_userRegistered,
  _$realtimeEventTypeEnum_userDeleted,
  _$realtimeEventTypeEnum_serverInfoUpdated,
  _$realtimeEventTypeEnum_serverConfigUpdated,
]);

Serializer<RealtimeEventTypeEnum> _$realtimeEventTypeEnumSerializer =
    _$RealtimeEventTypeEnumSerializer();

class _$RealtimeEventTypeEnumSerializer
    implements PrimitiveSerializer<RealtimeEventTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'postCreated': 'post_created',
    'postDeleted': 'post_deleted',
    'reactionUpdated': 'reaction_updated',
    'userRegistered': 'user_registered',
    'userDeleted': 'user_deleted',
    'serverInfoUpdated': 'server_info_updated',
    'serverConfigUpdated': 'server_config_updated',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'post_created': 'postCreated',
    'post_deleted': 'postDeleted',
    'reaction_updated': 'reactionUpdated',
    'user_registered': 'userRegistered',
    'user_deleted': 'userDeleted',
    'server_info_updated': 'serverInfoUpdated',
    'server_config_updated': 'serverConfigUpdated',
  };

  @override
  final Iterable<Type> types = const <Type>[RealtimeEventTypeEnum];
  @override
  final String wireName = 'RealtimeEventTypeEnum';

  @override
  Object serialize(Serializers serializers, RealtimeEventTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  RealtimeEventTypeEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      RealtimeEventTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$RealtimeEvent extends RealtimeEvent {
  @override
  final OneOf oneOf;

  factory _$RealtimeEvent([void Function(RealtimeEventBuilder)? updates]) =>
      (RealtimeEventBuilder()..update(updates))._build();

  _$RealtimeEvent._({required this.oneOf}) : super._();
  @override
  RealtimeEvent rebuild(void Function(RealtimeEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RealtimeEventBuilder toBuilder() => RealtimeEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RealtimeEvent && oneOf == other.oneOf;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, oneOf.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RealtimeEvent')..add('oneOf', oneOf))
        .toString();
  }
}

class RealtimeEventBuilder
    implements Builder<RealtimeEvent, RealtimeEventBuilder> {
  _$RealtimeEvent? _$v;

  OneOf? _oneOf;
  OneOf? get oneOf => _$this._oneOf;
  set oneOf(OneOf? oneOf) => _$this._oneOf = oneOf;

  RealtimeEventBuilder() {
    RealtimeEvent._defaults(this);
  }

  RealtimeEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _oneOf = $v.oneOf;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RealtimeEvent other) {
    _$v = other as _$RealtimeEvent;
  }

  @override
  void update(void Function(RealtimeEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RealtimeEvent build() => _build();

  _$RealtimeEvent _build() {
    final _$result = _$v ??
        _$RealtimeEvent._(
          oneOf: BuiltValueNullFieldError.checkNotNull(
              oneOf, r'RealtimeEvent', 'oneOf'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
