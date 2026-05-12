// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_admin_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateAdminRequest extends CreateAdminRequest {
  @override
  final String setupToken;
  @override
  final String username;
  @override
  final String password;

  factory _$CreateAdminRequest(
          [void Function(CreateAdminRequestBuilder)? updates]) =>
      (CreateAdminRequestBuilder()..update(updates))._build();

  _$CreateAdminRequest._(
      {required this.setupToken,
      required this.username,
      required this.password})
      : super._();
  @override
  CreateAdminRequest rebuild(
          void Function(CreateAdminRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateAdminRequestBuilder toBuilder() =>
      CreateAdminRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateAdminRequest &&
        setupToken == other.setupToken &&
        username == other.username &&
        password == other.password;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, setupToken.hashCode);
    _$hash = $jc(_$hash, username.hashCode);
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateAdminRequest')
          ..add('setupToken', setupToken)
          ..add('username', username)
          ..add('password', password))
        .toString();
  }
}

class CreateAdminRequestBuilder
    implements Builder<CreateAdminRequest, CreateAdminRequestBuilder> {
  _$CreateAdminRequest? _$v;

  String? _setupToken;
  String? get setupToken => _$this._setupToken;
  set setupToken(String? setupToken) => _$this._setupToken = setupToken;

  String? _username;
  String? get username => _$this._username;
  set username(String? username) => _$this._username = username;

  String? _password;
  String? get password => _$this._password;
  set password(String? password) => _$this._password = password;

  CreateAdminRequestBuilder() {
    CreateAdminRequest._defaults(this);
  }

  CreateAdminRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _setupToken = $v.setupToken;
      _username = $v.username;
      _password = $v.password;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateAdminRequest other) {
    _$v = other as _$CreateAdminRequest;
  }

  @override
  void update(void Function(CreateAdminRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateAdminRequest build() => _build();

  _$CreateAdminRequest _build() {
    final _$result = _$v ??
        _$CreateAdminRequest._(
          setupToken: BuiltValueNullFieldError.checkNotNull(
              setupToken, r'CreateAdminRequest', 'setupToken'),
          username: BuiltValueNullFieldError.checkNotNull(
              username, r'CreateAdminRequest', 'username'),
          password: BuiltValueNullFieldError.checkNotNull(
              password, r'CreateAdminRequest', 'password'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
