// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_username_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateUsernameRequest extends UpdateUsernameRequest {
  @override
  final String username;

  factory _$UpdateUsernameRequest(
          [void Function(UpdateUsernameRequestBuilder)? updates]) =>
      (UpdateUsernameRequestBuilder()..update(updates))._build();

  _$UpdateUsernameRequest._({required this.username}) : super._();
  @override
  UpdateUsernameRequest rebuild(
          void Function(UpdateUsernameRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateUsernameRequestBuilder toBuilder() =>
      UpdateUsernameRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateUsernameRequest && username == other.username;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, username.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateUsernameRequest')
          ..add('username', username))
        .toString();
  }
}

class UpdateUsernameRequestBuilder
    implements Builder<UpdateUsernameRequest, UpdateUsernameRequestBuilder> {
  _$UpdateUsernameRequest? _$v;

  String? _username;
  String? get username => _$this._username;
  set username(String? username) => _$this._username = username;

  UpdateUsernameRequestBuilder() {
    UpdateUsernameRequest._defaults(this);
  }

  UpdateUsernameRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _username = $v.username;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateUsernameRequest other) {
    _$v = other as _$UpdateUsernameRequest;
  }

  @override
  void update(void Function(UpdateUsernameRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateUsernameRequest build() => _build();

  _$UpdateUsernameRequest _build() {
    final _$result = _$v ??
        _$UpdateUsernameRequest._(
          username: BuiltValueNullFieldError.checkNotNull(
              username, r'UpdateUsernameRequest', 'username'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
