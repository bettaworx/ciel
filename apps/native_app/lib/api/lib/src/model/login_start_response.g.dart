// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'login_start_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LoginStartResponse extends LoginStartResponse {
  @override
  final String loginSessionId;
  @override
  final String salt;
  @override
  final int iterations;
  @override
  final String serverNonce;
  @override
  final int expiresInSeconds;

  factory _$LoginStartResponse(
          [void Function(LoginStartResponseBuilder)? updates]) =>
      (LoginStartResponseBuilder()..update(updates))._build();

  _$LoginStartResponse._(
      {required this.loginSessionId,
      required this.salt,
      required this.iterations,
      required this.serverNonce,
      required this.expiresInSeconds})
      : super._();
  @override
  LoginStartResponse rebuild(
          void Function(LoginStartResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LoginStartResponseBuilder toBuilder() =>
      LoginStartResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LoginStartResponse &&
        loginSessionId == other.loginSessionId &&
        salt == other.salt &&
        iterations == other.iterations &&
        serverNonce == other.serverNonce &&
        expiresInSeconds == other.expiresInSeconds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, loginSessionId.hashCode);
    _$hash = $jc(_$hash, salt.hashCode);
    _$hash = $jc(_$hash, iterations.hashCode);
    _$hash = $jc(_$hash, serverNonce.hashCode);
    _$hash = $jc(_$hash, expiresInSeconds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LoginStartResponse')
          ..add('loginSessionId', loginSessionId)
          ..add('salt', salt)
          ..add('iterations', iterations)
          ..add('serverNonce', serverNonce)
          ..add('expiresInSeconds', expiresInSeconds))
        .toString();
  }
}

class LoginStartResponseBuilder
    implements Builder<LoginStartResponse, LoginStartResponseBuilder> {
  _$LoginStartResponse? _$v;

  String? _loginSessionId;
  String? get loginSessionId => _$this._loginSessionId;
  set loginSessionId(String? loginSessionId) =>
      _$this._loginSessionId = loginSessionId;

  String? _salt;
  String? get salt => _$this._salt;
  set salt(String? salt) => _$this._salt = salt;

  int? _iterations;
  int? get iterations => _$this._iterations;
  set iterations(int? iterations) => _$this._iterations = iterations;

  String? _serverNonce;
  String? get serverNonce => _$this._serverNonce;
  set serverNonce(String? serverNonce) => _$this._serverNonce = serverNonce;

  int? _expiresInSeconds;
  int? get expiresInSeconds => _$this._expiresInSeconds;
  set expiresInSeconds(int? expiresInSeconds) =>
      _$this._expiresInSeconds = expiresInSeconds;

  LoginStartResponseBuilder() {
    LoginStartResponse._defaults(this);
  }

  LoginStartResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _loginSessionId = $v.loginSessionId;
      _salt = $v.salt;
      _iterations = $v.iterations;
      _serverNonce = $v.serverNonce;
      _expiresInSeconds = $v.expiresInSeconds;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LoginStartResponse other) {
    _$v = other as _$LoginStartResponse;
  }

  @override
  void update(void Function(LoginStartResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LoginStartResponse build() => _build();

  _$LoginStartResponse _build() {
    final _$result = _$v ??
        _$LoginStartResponse._(
          loginSessionId: BuiltValueNullFieldError.checkNotNull(
              loginSessionId, r'LoginStartResponse', 'loginSessionId'),
          salt: BuiltValueNullFieldError.checkNotNull(
              salt, r'LoginStartResponse', 'salt'),
          iterations: BuiltValueNullFieldError.checkNotNull(
              iterations, r'LoginStartResponse', 'iterations'),
          serverNonce: BuiltValueNullFieldError.checkNotNull(
              serverNonce, r'LoginStartResponse', 'serverNonce'),
          expiresInSeconds: BuiltValueNullFieldError.checkNotNull(
              expiresInSeconds, r'LoginStartResponse', 'expiresInSeconds'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
