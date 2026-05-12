// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_admin_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateAdminResponse extends CreateAdminResponse {
  @override
  final User user;
  @override
  final String token;

  factory _$CreateAdminResponse(
          [void Function(CreateAdminResponseBuilder)? updates]) =>
      (CreateAdminResponseBuilder()..update(updates))._build();

  _$CreateAdminResponse._({required this.user, required this.token})
      : super._();
  @override
  CreateAdminResponse rebuild(
          void Function(CreateAdminResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateAdminResponseBuilder toBuilder() =>
      CreateAdminResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateAdminResponse &&
        user == other.user &&
        token == other.token;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateAdminResponse')
          ..add('user', user)
          ..add('token', token))
        .toString();
  }
}

class CreateAdminResponseBuilder
    implements Builder<CreateAdminResponse, CreateAdminResponseBuilder> {
  _$CreateAdminResponse? _$v;

  User? _user;
  User? get user => _$this._user;
  set user(User? user) => _$this._user = user;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  CreateAdminResponseBuilder() {
    CreateAdminResponse._defaults(this);
  }

  CreateAdminResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _user = $v.user;
      _token = $v.token;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateAdminResponse other) {
    _$v = other as _$CreateAdminResponse;
  }

  @override
  void update(void Function(CreateAdminResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateAdminResponse build() => _build();

  _$CreateAdminResponse _build() {
    final _$result = _$v ??
        _$CreateAdminResponse._(
          user: BuiltValueNullFieldError.checkNotNull(
              user, r'CreateAdminResponse', 'user'),
          token: BuiltValueNullFieldError.checkNotNull(
              token, r'CreateAdminResponse', 'token'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
