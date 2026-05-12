// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'server_info_updated_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ServerInfoUpdatedEventTypeEnum
    _$serverInfoUpdatedEventTypeEnum_serverInfoUpdated =
    const ServerInfoUpdatedEventTypeEnum._('serverInfoUpdated');

ServerInfoUpdatedEventTypeEnum _$serverInfoUpdatedEventTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'serverInfoUpdated':
      return _$serverInfoUpdatedEventTypeEnum_serverInfoUpdated;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ServerInfoUpdatedEventTypeEnum>
    _$serverInfoUpdatedEventTypeEnumValues = BuiltSet<
        ServerInfoUpdatedEventTypeEnum>(const <ServerInfoUpdatedEventTypeEnum>[
  _$serverInfoUpdatedEventTypeEnum_serverInfoUpdated,
]);

Serializer<ServerInfoUpdatedEventTypeEnum>
    _$serverInfoUpdatedEventTypeEnumSerializer =
    _$ServerInfoUpdatedEventTypeEnumSerializer();

class _$ServerInfoUpdatedEventTypeEnumSerializer
    implements PrimitiveSerializer<ServerInfoUpdatedEventTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'serverInfoUpdated': 'server_info_updated',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'server_info_updated': 'serverInfoUpdated',
  };

  @override
  final Iterable<Type> types = const <Type>[ServerInfoUpdatedEventTypeEnum];
  @override
  final String wireName = 'ServerInfoUpdatedEventTypeEnum';

  @override
  Object serialize(
          Serializers serializers, ServerInfoUpdatedEventTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ServerInfoUpdatedEventTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ServerInfoUpdatedEventTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ServerInfoUpdatedEvent extends ServerInfoUpdatedEvent {
  @override
  final ServerInfoUpdatedEventTypeEnum type;
  @override
  final ServerInfo serverInfo;

  factory _$ServerInfoUpdatedEvent(
          [void Function(ServerInfoUpdatedEventBuilder)? updates]) =>
      (ServerInfoUpdatedEventBuilder()..update(updates))._build();

  _$ServerInfoUpdatedEvent._({required this.type, required this.serverInfo})
      : super._();
  @override
  ServerInfoUpdatedEvent rebuild(
          void Function(ServerInfoUpdatedEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ServerInfoUpdatedEventBuilder toBuilder() =>
      ServerInfoUpdatedEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ServerInfoUpdatedEvent &&
        type == other.type &&
        serverInfo == other.serverInfo;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, serverInfo.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ServerInfoUpdatedEvent')
          ..add('type', type)
          ..add('serverInfo', serverInfo))
        .toString();
  }
}

class ServerInfoUpdatedEventBuilder
    implements Builder<ServerInfoUpdatedEvent, ServerInfoUpdatedEventBuilder> {
  _$ServerInfoUpdatedEvent? _$v;

  ServerInfoUpdatedEventTypeEnum? _type;
  ServerInfoUpdatedEventTypeEnum? get type => _$this._type;
  set type(ServerInfoUpdatedEventTypeEnum? type) => _$this._type = type;

  ServerInfoBuilder? _serverInfo;
  ServerInfoBuilder get serverInfo =>
      _$this._serverInfo ??= ServerInfoBuilder();
  set serverInfo(ServerInfoBuilder? serverInfo) =>
      _$this._serverInfo = serverInfo;

  ServerInfoUpdatedEventBuilder() {
    ServerInfoUpdatedEvent._defaults(this);
  }

  ServerInfoUpdatedEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _serverInfo = $v.serverInfo.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ServerInfoUpdatedEvent other) {
    _$v = other as _$ServerInfoUpdatedEvent;
  }

  @override
  void update(void Function(ServerInfoUpdatedEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ServerInfoUpdatedEvent build() => _build();

  _$ServerInfoUpdatedEvent _build() {
    _$ServerInfoUpdatedEvent _$result;
    try {
      _$result = _$v ??
          _$ServerInfoUpdatedEvent._(
            type: BuiltValueNullFieldError.checkNotNull(
                type, r'ServerInfoUpdatedEvent', 'type'),
            serverInfo: serverInfo.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'serverInfo';
        serverInfo.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ServerInfoUpdatedEvent', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
