// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'server_setup_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ServerSetupRequest extends ServerSetupRequest {
  @override
  final String? serverName;
  @override
  final String? serverDescription;
  @override
  final String? serverIconMediaId;
  @override
  final bool? inviteOnly;
  @override
  final String? inviteCode;

  factory _$ServerSetupRequest(
          [void Function(ServerSetupRequestBuilder)? updates]) =>
      (ServerSetupRequestBuilder()..update(updates))._build();

  _$ServerSetupRequest._(
      {this.serverName,
      this.serverDescription,
      this.serverIconMediaId,
      this.inviteOnly,
      this.inviteCode})
      : super._();
  @override
  ServerSetupRequest rebuild(
          void Function(ServerSetupRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ServerSetupRequestBuilder toBuilder() =>
      ServerSetupRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ServerSetupRequest &&
        serverName == other.serverName &&
        serverDescription == other.serverDescription &&
        serverIconMediaId == other.serverIconMediaId &&
        inviteOnly == other.inviteOnly &&
        inviteCode == other.inviteCode;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, serverName.hashCode);
    _$hash = $jc(_$hash, serverDescription.hashCode);
    _$hash = $jc(_$hash, serverIconMediaId.hashCode);
    _$hash = $jc(_$hash, inviteOnly.hashCode);
    _$hash = $jc(_$hash, inviteCode.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ServerSetupRequest')
          ..add('serverName', serverName)
          ..add('serverDescription', serverDescription)
          ..add('serverIconMediaId', serverIconMediaId)
          ..add('inviteOnly', inviteOnly)
          ..add('inviteCode', inviteCode))
        .toString();
  }
}

class ServerSetupRequestBuilder
    implements Builder<ServerSetupRequest, ServerSetupRequestBuilder> {
  _$ServerSetupRequest? _$v;

  String? _serverName;
  String? get serverName => _$this._serverName;
  set serverName(String? serverName) => _$this._serverName = serverName;

  String? _serverDescription;
  String? get serverDescription => _$this._serverDescription;
  set serverDescription(String? serverDescription) =>
      _$this._serverDescription = serverDescription;

  String? _serverIconMediaId;
  String? get serverIconMediaId => _$this._serverIconMediaId;
  set serverIconMediaId(String? serverIconMediaId) =>
      _$this._serverIconMediaId = serverIconMediaId;

  bool? _inviteOnly;
  bool? get inviteOnly => _$this._inviteOnly;
  set inviteOnly(bool? inviteOnly) => _$this._inviteOnly = inviteOnly;

  String? _inviteCode;
  String? get inviteCode => _$this._inviteCode;
  set inviteCode(String? inviteCode) => _$this._inviteCode = inviteCode;

  ServerSetupRequestBuilder() {
    ServerSetupRequest._defaults(this);
  }

  ServerSetupRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _serverName = $v.serverName;
      _serverDescription = $v.serverDescription;
      _serverIconMediaId = $v.serverIconMediaId;
      _inviteOnly = $v.inviteOnly;
      _inviteCode = $v.inviteCode;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ServerSetupRequest other) {
    _$v = other as _$ServerSetupRequest;
  }

  @override
  void update(void Function(ServerSetupRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ServerSetupRequest build() => _build();

  _$ServerSetupRequest _build() {
    final _$result = _$v ??
        _$ServerSetupRequest._(
          serverName: serverName,
          serverDescription: serverDescription,
          serverIconMediaId: serverIconMediaId,
          inviteOnly: inviteOnly,
          inviteCode: inviteCode,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
