// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'login_finish_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LoginFinishRequest extends LoginFinishRequest {
  @override
  final String loginSessionId;
  @override
  final String clientFinalNonce;
  @override
  final String clientProof;

  factory _$LoginFinishRequest(
          [void Function(LoginFinishRequestBuilder)? updates]) =>
      (LoginFinishRequestBuilder()..update(updates))._build();

  _$LoginFinishRequest._(
      {required this.loginSessionId,
      required this.clientFinalNonce,
      required this.clientProof})
      : super._();
  @override
  LoginFinishRequest rebuild(
          void Function(LoginFinishRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LoginFinishRequestBuilder toBuilder() =>
      LoginFinishRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LoginFinishRequest &&
        loginSessionId == other.loginSessionId &&
        clientFinalNonce == other.clientFinalNonce &&
        clientProof == other.clientProof;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, loginSessionId.hashCode);
    _$hash = $jc(_$hash, clientFinalNonce.hashCode);
    _$hash = $jc(_$hash, clientProof.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LoginFinishRequest')
          ..add('loginSessionId', loginSessionId)
          ..add('clientFinalNonce', clientFinalNonce)
          ..add('clientProof', clientProof))
        .toString();
  }
}

class LoginFinishRequestBuilder
    implements Builder<LoginFinishRequest, LoginFinishRequestBuilder> {
  _$LoginFinishRequest? _$v;

  String? _loginSessionId;
  String? get loginSessionId => _$this._loginSessionId;
  set loginSessionId(String? loginSessionId) =>
      _$this._loginSessionId = loginSessionId;

  String? _clientFinalNonce;
  String? get clientFinalNonce => _$this._clientFinalNonce;
  set clientFinalNonce(String? clientFinalNonce) =>
      _$this._clientFinalNonce = clientFinalNonce;

  String? _clientProof;
  String? get clientProof => _$this._clientProof;
  set clientProof(String? clientProof) => _$this._clientProof = clientProof;

  LoginFinishRequestBuilder() {
    LoginFinishRequest._defaults(this);
  }

  LoginFinishRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _loginSessionId = $v.loginSessionId;
      _clientFinalNonce = $v.clientFinalNonce;
      _clientProof = $v.clientProof;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LoginFinishRequest other) {
    _$v = other as _$LoginFinishRequest;
  }

  @override
  void update(void Function(LoginFinishRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LoginFinishRequest build() => _build();

  _$LoginFinishRequest _build() {
    final _$result = _$v ??
        _$LoginFinishRequest._(
          loginSessionId: BuiltValueNullFieldError.checkNotNull(
              loginSessionId, r'LoginFinishRequest', 'loginSessionId'),
          clientFinalNonce: BuiltValueNullFieldError.checkNotNull(
              clientFinalNonce, r'LoginFinishRequest', 'clientFinalNonce'),
          clientProof: BuiltValueNullFieldError.checkNotNull(
              clientProof, r'LoginFinishRequest', 'clientProof'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
