// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'verify_setup_password_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$VerifySetupPasswordRequest extends VerifySetupPasswordRequest {
  @override
  final String password;

  factory _$VerifySetupPasswordRequest(
          [void Function(VerifySetupPasswordRequestBuilder)? updates]) =>
      (VerifySetupPasswordRequestBuilder()..update(updates))._build();

  _$VerifySetupPasswordRequest._({required this.password}) : super._();
  @override
  VerifySetupPasswordRequest rebuild(
          void Function(VerifySetupPasswordRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  VerifySetupPasswordRequestBuilder toBuilder() =>
      VerifySetupPasswordRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is VerifySetupPasswordRequest && password == other.password;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'VerifySetupPasswordRequest')
          ..add('password', password))
        .toString();
  }
}

class VerifySetupPasswordRequestBuilder
    implements
        Builder<VerifySetupPasswordRequest, VerifySetupPasswordRequestBuilder> {
  _$VerifySetupPasswordRequest? _$v;

  String? _password;
  String? get password => _$this._password;
  set password(String? password) => _$this._password = password;

  VerifySetupPasswordRequestBuilder() {
    VerifySetupPasswordRequest._defaults(this);
  }

  VerifySetupPasswordRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _password = $v.password;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(VerifySetupPasswordRequest other) {
    _$v = other as _$VerifySetupPasswordRequest;
  }

  @override
  void update(void Function(VerifySetupPasswordRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  VerifySetupPasswordRequest build() => _build();

  _$VerifySetupPasswordRequest _build() {
    final _$result = _$v ??
        _$VerifySetupPasswordRequest._(
          password: BuiltValueNullFieldError.checkNotNull(
              password, r'VerifySetupPasswordRequest', 'password'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
