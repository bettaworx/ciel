// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'server_config_updated_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ServerConfigUpdatedEventTypeEnum
    _$serverConfigUpdatedEventTypeEnum_serverConfigUpdated =
    const ServerConfigUpdatedEventTypeEnum._('serverConfigUpdated');

ServerConfigUpdatedEventTypeEnum _$serverConfigUpdatedEventTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'serverConfigUpdated':
      return _$serverConfigUpdatedEventTypeEnum_serverConfigUpdated;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ServerConfigUpdatedEventTypeEnum>
    _$serverConfigUpdatedEventTypeEnumValues = BuiltSet<
        ServerConfigUpdatedEventTypeEnum>(const <ServerConfigUpdatedEventTypeEnum>[
  _$serverConfigUpdatedEventTypeEnum_serverConfigUpdated,
]);

Serializer<ServerConfigUpdatedEventTypeEnum>
    _$serverConfigUpdatedEventTypeEnumSerializer =
    _$ServerConfigUpdatedEventTypeEnumSerializer();

class _$ServerConfigUpdatedEventTypeEnumSerializer
    implements PrimitiveSerializer<ServerConfigUpdatedEventTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'serverConfigUpdated': 'server_config_updated',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'server_config_updated': 'serverConfigUpdated',
  };

  @override
  final Iterable<Type> types = const <Type>[ServerConfigUpdatedEventTypeEnum];
  @override
  final String wireName = 'ServerConfigUpdatedEventTypeEnum';

  @override
  Object serialize(
          Serializers serializers, ServerConfigUpdatedEventTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ServerConfigUpdatedEventTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ServerConfigUpdatedEventTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ServerConfigUpdatedEvent extends ServerConfigUpdatedEvent {
  @override
  final ServerConfigUpdatedEventTypeEnum type;
  @override
  final ServerConfig serverConfig;

  factory _$ServerConfigUpdatedEvent(
          [void Function(ServerConfigUpdatedEventBuilder)? updates]) =>
      (ServerConfigUpdatedEventBuilder()..update(updates))._build();

  _$ServerConfigUpdatedEvent._({required this.type, required this.serverConfig})
      : super._();
  @override
  ServerConfigUpdatedEvent rebuild(
          void Function(ServerConfigUpdatedEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ServerConfigUpdatedEventBuilder toBuilder() =>
      ServerConfigUpdatedEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ServerConfigUpdatedEvent &&
        type == other.type &&
        serverConfig == other.serverConfig;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, serverConfig.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ServerConfigUpdatedEvent')
          ..add('type', type)
          ..add('serverConfig', serverConfig))
        .toString();
  }
}

class ServerConfigUpdatedEventBuilder
    implements
        Builder<ServerConfigUpdatedEvent, ServerConfigUpdatedEventBuilder> {
  _$ServerConfigUpdatedEvent? _$v;

  ServerConfigUpdatedEventTypeEnum? _type;
  ServerConfigUpdatedEventTypeEnum? get type => _$this._type;
  set type(ServerConfigUpdatedEventTypeEnum? type) => _$this._type = type;

  ServerConfigBuilder? _serverConfig;
  ServerConfigBuilder get serverConfig =>
      _$this._serverConfig ??= ServerConfigBuilder();
  set serverConfig(ServerConfigBuilder? serverConfig) =>
      _$this._serverConfig = serverConfig;

  ServerConfigUpdatedEventBuilder() {
    ServerConfigUpdatedEvent._defaults(this);
  }

  ServerConfigUpdatedEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _serverConfig = $v.serverConfig.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ServerConfigUpdatedEvent other) {
    _$v = other as _$ServerConfigUpdatedEvent;
  }

  @override
  void update(void Function(ServerConfigUpdatedEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ServerConfigUpdatedEvent build() => _build();

  _$ServerConfigUpdatedEvent _build() {
    _$ServerConfigUpdatedEvent _$result;
    try {
      _$result = _$v ??
          _$ServerConfigUpdatedEvent._(
            type: BuiltValueNullFieldError.checkNotNull(
                type, r'ServerConfigUpdatedEvent', 'type'),
            serverConfig: serverConfig.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'serverConfig';
        serverConfig.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ServerConfigUpdatedEvent', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
