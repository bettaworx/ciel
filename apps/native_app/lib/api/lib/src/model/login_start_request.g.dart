// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'login_start_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LoginStartRequest extends LoginStartRequest {
  @override
  final String username;
  @override
  final String clientNonce;

  factory _$LoginStartRequest(
          [void Function(LoginStartRequestBuilder)? updates]) =>
      (LoginStartRequestBuilder()..update(updates))._build();

  _$LoginStartRequest._({required this.username, required this.clientNonce})
      : super._();
  @override
  LoginStartRequest rebuild(void Function(LoginStartRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LoginStartRequestBuilder toBuilder() =>
      LoginStartRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LoginStartRequest &&
        username == other.username &&
        clientNonce == other.clientNonce;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, username.hashCode);
    _$hash = $jc(_$hash, clientNonce.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LoginStartRequest')
          ..add('username', username)
          ..add('clientNonce', clientNonce))
        .toString();
  }
}

class LoginStartRequestBuilder
    implements Builder<LoginStartRequest, LoginStartRequestBuilder> {
  _$LoginStartRequest? _$v;

  String? _username;
  String? get username => _$this._username;
  set username(String? username) => _$this._username = username;

  String? _clientNonce;
  String? get clientNonce => _$this._clientNonce;
  set clientNonce(String? clientNonce) => _$this._clientNonce = clientNonce;

  LoginStartRequestBuilder() {
    LoginStartRequest._defaults(this);
  }

  LoginStartRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _username = $v.username;
      _clientNonce = $v.clientNonce;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LoginStartRequest other) {
    _$v = other as _$LoginStartRequest;
  }

  @override
  void update(void Function(LoginStartRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LoginStartRequest build() => _build();

  _$LoginStartRequest _build() {
    final _$result = _$v ??
        _$LoginStartRequest._(
          username: BuiltValueNullFieldError.checkNotNull(
              username, r'LoginStartRequest', 'username'),
          clientNonce: BuiltValueNullFieldError.checkNotNull(
              clientNonce, r'LoginStartRequest', 'clientNonce'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
