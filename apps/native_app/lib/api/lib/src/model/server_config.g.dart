// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'server_config.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ServerConfig extends ServerConfig {
  @override
  final bool signupEnabled;
  @override
  final int configVersion;
  @override
  final MediaLimits mediaLimits;
  @override
  final int maxPostContentLength;

  factory _$ServerConfig([void Function(ServerConfigBuilder)? updates]) =>
      (ServerConfigBuilder()..update(updates))._build();

  _$ServerConfig._(
      {required this.signupEnabled,
      required this.configVersion,
      required this.mediaLimits,
      required this.maxPostContentLength})
      : super._();
  @override
  ServerConfig rebuild(void Function(ServerConfigBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ServerConfigBuilder toBuilder() => ServerConfigBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ServerConfig &&
        signupEnabled == other.signupEnabled &&
        configVersion == other.configVersion &&
        mediaLimits == other.mediaLimits &&
        maxPostContentLength == other.maxPostContentLength;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, signupEnabled.hashCode);
    _$hash = $jc(_$hash, configVersion.hashCode);
    _$hash = $jc(_$hash, mediaLimits.hashCode);
    _$hash = $jc(_$hash, maxPostContentLength.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ServerConfig')
          ..add('signupEnabled', signupEnabled)
          ..add('configVersion', configVersion)
          ..add('mediaLimits', mediaLimits)
          ..add('maxPostContentLength', maxPostContentLength))
        .toString();
  }
}

class ServerConfigBuilder
    implements Builder<ServerConfig, ServerConfigBuilder> {
  _$ServerConfig? _$v;

  bool? _signupEnabled;
  bool? get signupEnabled => _$this._signupEnabled;
  set signupEnabled(bool? signupEnabled) =>
      _$this._signupEnabled = signupEnabled;

  int? _configVersion;
  int? get configVersion => _$this._configVersion;
  set configVersion(int? configVersion) =>
      _$this._configVersion = configVersion;

  MediaLimitsBuilder? _mediaLimits;
  MediaLimitsBuilder get mediaLimits =>
      _$this._mediaLimits ??= MediaLimitsBuilder();
  set mediaLimits(MediaLimitsBuilder? mediaLimits) =>
      _$this._mediaLimits = mediaLimits;

  int? _maxPostContentLength;
  int? get maxPostContentLength => _$this._maxPostContentLength;
  set maxPostContentLength(int? maxPostContentLength) =>
      _$this._maxPostContentLength = maxPostContentLength;

  ServerConfigBuilder() {
    ServerConfig._defaults(this);
  }

  ServerConfigBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _signupEnabled = $v.signupEnabled;
      _configVersion = $v.configVersion;
      _mediaLimits = $v.mediaLimits.toBuilder();
      _maxPostContentLength = $v.maxPostContentLength;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ServerConfig other) {
    _$v = other as _$ServerConfig;
  }

  @override
  void update(void Function(ServerConfigBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ServerConfig build() => _build();

  _$ServerConfig _build() {
    _$ServerConfig _$result;
    try {
      _$result = _$v ??
          _$ServerConfig._(
            signupEnabled: BuiltValueNullFieldError.checkNotNull(
                signupEnabled, r'ServerConfig', 'signupEnabled'),
            configVersion: BuiltValueNullFieldError.checkNotNull(
                configVersion, r'ServerConfig', 'configVersion'),
            mediaLimits: mediaLimits.build(),
            maxPostContentLength: BuiltValueNullFieldError.checkNotNull(
                maxPostContentLength, r'ServerConfig', 'maxPostContentLength'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'mediaLimits';
        mediaLimits.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ServerConfig', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
