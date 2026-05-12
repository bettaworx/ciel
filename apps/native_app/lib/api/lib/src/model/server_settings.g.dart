// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'server_settings.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ServerSettings extends ServerSettings {
  @override
  final bool signupEnabled;
  @override
  final int? termsVersion;
  @override
  final int? privacyVersion;

  factory _$ServerSettings([void Function(ServerSettingsBuilder)? updates]) =>
      (ServerSettingsBuilder()..update(updates))._build();

  _$ServerSettings._(
      {required this.signupEnabled, this.termsVersion, this.privacyVersion})
      : super._();
  @override
  ServerSettings rebuild(void Function(ServerSettingsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ServerSettingsBuilder toBuilder() => ServerSettingsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ServerSettings &&
        signupEnabled == other.signupEnabled &&
        termsVersion == other.termsVersion &&
        privacyVersion == other.privacyVersion;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, signupEnabled.hashCode);
    _$hash = $jc(_$hash, termsVersion.hashCode);
    _$hash = $jc(_$hash, privacyVersion.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ServerSettings')
          ..add('signupEnabled', signupEnabled)
          ..add('termsVersion', termsVersion)
          ..add('privacyVersion', privacyVersion))
        .toString();
  }
}

class ServerSettingsBuilder
    implements Builder<ServerSettings, ServerSettingsBuilder> {
  _$ServerSettings? _$v;

  bool? _signupEnabled;
  bool? get signupEnabled => _$this._signupEnabled;
  set signupEnabled(bool? signupEnabled) =>
      _$this._signupEnabled = signupEnabled;

  int? _termsVersion;
  int? get termsVersion => _$this._termsVersion;
  set termsVersion(int? termsVersion) => _$this._termsVersion = termsVersion;

  int? _privacyVersion;
  int? get privacyVersion => _$this._privacyVersion;
  set privacyVersion(int? privacyVersion) =>
      _$this._privacyVersion = privacyVersion;

  ServerSettingsBuilder() {
    ServerSettings._defaults(this);
  }

  ServerSettingsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _signupEnabled = $v.signupEnabled;
      _termsVersion = $v.termsVersion;
      _privacyVersion = $v.privacyVersion;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ServerSettings other) {
    _$v = other as _$ServerSettings;
  }

  @override
  void update(void Function(ServerSettingsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ServerSettings build() => _build();

  _$ServerSettings _build() {
    final _$result = _$v ??
        _$ServerSettings._(
          signupEnabled: BuiltValueNullFieldError.checkNotNull(
              signupEnabled, r'ServerSettings', 'signupEnabled'),
          termsVersion: termsVersion,
          privacyVersion: privacyVersion,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
