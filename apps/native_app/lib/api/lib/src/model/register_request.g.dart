// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'register_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RegisterRequest extends RegisterRequest {
  @override
  final String username;
  @override
  final String password;
  @override
  final int termsVersion;
  @override
  final int privacyVersion;
  @override
  final String? inviteCode;

  factory _$RegisterRequest([void Function(RegisterRequestBuilder)? updates]) =>
      (RegisterRequestBuilder()..update(updates))._build();

  _$RegisterRequest._(
      {required this.username,
      required this.password,
      required this.termsVersion,
      required this.privacyVersion,
      this.inviteCode})
      : super._();
  @override
  RegisterRequest rebuild(void Function(RegisterRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RegisterRequestBuilder toBuilder() => RegisterRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RegisterRequest &&
        username == other.username &&
        password == other.password &&
        termsVersion == other.termsVersion &&
        privacyVersion == other.privacyVersion &&
        inviteCode == other.inviteCode;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, username.hashCode);
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jc(_$hash, termsVersion.hashCode);
    _$hash = $jc(_$hash, privacyVersion.hashCode);
    _$hash = $jc(_$hash, inviteCode.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RegisterRequest')
          ..add('username', username)
          ..add('password', password)
          ..add('termsVersion', termsVersion)
          ..add('privacyVersion', privacyVersion)
          ..add('inviteCode', inviteCode))
        .toString();
  }
}

class RegisterRequestBuilder
    implements Builder<RegisterRequest, RegisterRequestBuilder> {
  _$RegisterRequest? _$v;

  String? _username;
  String? get username => _$this._username;
  set username(String? username) => _$this._username = username;

  String? _password;
  String? get password => _$this._password;
  set password(String? password) => _$this._password = password;

  int? _termsVersion;
  int? get termsVersion => _$this._termsVersion;
  set termsVersion(int? termsVersion) => _$this._termsVersion = termsVersion;

  int? _privacyVersion;
  int? get privacyVersion => _$this._privacyVersion;
  set privacyVersion(int? privacyVersion) =>
      _$this._privacyVersion = privacyVersion;

  String? _inviteCode;
  String? get inviteCode => _$this._inviteCode;
  set inviteCode(String? inviteCode) => _$this._inviteCode = inviteCode;

  RegisterRequestBuilder() {
    RegisterRequest._defaults(this);
  }

  RegisterRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _username = $v.username;
      _password = $v.password;
      _termsVersion = $v.termsVersion;
      _privacyVersion = $v.privacyVersion;
      _inviteCode = $v.inviteCode;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RegisterRequest other) {
    _$v = other as _$RegisterRequest;
  }

  @override
  void update(void Function(RegisterRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RegisterRequest build() => _build();

  _$RegisterRequest _build() {
    final _$result = _$v ??
        _$RegisterRequest._(
          username: BuiltValueNullFieldError.checkNotNull(
              username, r'RegisterRequest', 'username'),
          password: BuiltValueNullFieldError.checkNotNull(
              password, r'RegisterRequest', 'password'),
          termsVersion: BuiltValueNullFieldError.checkNotNull(
              termsVersion, r'RegisterRequest', 'termsVersion'),
          privacyVersion: BuiltValueNullFieldError.checkNotNull(
              privacyVersion, r'RegisterRequest', 'privacyVersion'),
          inviteCode: inviteCode,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
