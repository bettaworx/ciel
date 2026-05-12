// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'server_info.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ServerInfo extends ServerInfo {
  @override
  final ServerStats stats;
  @override
  final String? serverName;
  @override
  final String? serverDescription;
  @override
  final String? serverIconUrl;
  @override
  final String? commit;
  @override
  final String? branch;
  @override
  final String? version;

  factory _$ServerInfo([void Function(ServerInfoBuilder)? updates]) =>
      (ServerInfoBuilder()..update(updates))._build();

  _$ServerInfo._(
      {required this.stats,
      this.serverName,
      this.serverDescription,
      this.serverIconUrl,
      this.commit,
      this.branch,
      this.version})
      : super._();
  @override
  ServerInfo rebuild(void Function(ServerInfoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ServerInfoBuilder toBuilder() => ServerInfoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ServerInfo &&
        stats == other.stats &&
        serverName == other.serverName &&
        serverDescription == other.serverDescription &&
        serverIconUrl == other.serverIconUrl &&
        commit == other.commit &&
        branch == other.branch &&
        version == other.version;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, stats.hashCode);
    _$hash = $jc(_$hash, serverName.hashCode);
    _$hash = $jc(_$hash, serverDescription.hashCode);
    _$hash = $jc(_$hash, serverIconUrl.hashCode);
    _$hash = $jc(_$hash, commit.hashCode);
    _$hash = $jc(_$hash, branch.hashCode);
    _$hash = $jc(_$hash, version.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ServerInfo')
          ..add('stats', stats)
          ..add('serverName', serverName)
          ..add('serverDescription', serverDescription)
          ..add('serverIconUrl', serverIconUrl)
          ..add('commit', commit)
          ..add('branch', branch)
          ..add('version', version))
        .toString();
  }
}

class ServerInfoBuilder implements Builder<ServerInfo, ServerInfoBuilder> {
  _$ServerInfo? _$v;

  ServerStatsBuilder? _stats;
  ServerStatsBuilder get stats => _$this._stats ??= ServerStatsBuilder();
  set stats(ServerStatsBuilder? stats) => _$this._stats = stats;

  String? _serverName;
  String? get serverName => _$this._serverName;
  set serverName(String? serverName) => _$this._serverName = serverName;

  String? _serverDescription;
  String? get serverDescription => _$this._serverDescription;
  set serverDescription(String? serverDescription) =>
      _$this._serverDescription = serverDescription;

  String? _serverIconUrl;
  String? get serverIconUrl => _$this._serverIconUrl;
  set serverIconUrl(String? serverIconUrl) =>
      _$this._serverIconUrl = serverIconUrl;

  String? _commit;
  String? get commit => _$this._commit;
  set commit(String? commit) => _$this._commit = commit;

  String? _branch;
  String? get branch => _$this._branch;
  set branch(String? branch) => _$this._branch = branch;

  String? _version;
  String? get version => _$this._version;
  set version(String? version) => _$this._version = version;

  ServerInfoBuilder() {
    ServerInfo._defaults(this);
  }

  ServerInfoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _stats = $v.stats.toBuilder();
      _serverName = $v.serverName;
      _serverDescription = $v.serverDescription;
      _serverIconUrl = $v.serverIconUrl;
      _commit = $v.commit;
      _branch = $v.branch;
      _version = $v.version;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ServerInfo other) {
    _$v = other as _$ServerInfo;
  }

  @override
  void update(void Function(ServerInfoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ServerInfo build() => _build();

  _$ServerInfo _build() {
    _$ServerInfo _$result;
    try {
      _$result = _$v ??
          _$ServerInfo._(
            stats: stats.build(),
            serverName: serverName,
            serverDescription: serverDescription,
            serverIconUrl: serverIconUrl,
            commit: commit,
            branch: branch,
            version: version,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'stats';
        stats.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ServerInfo', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
