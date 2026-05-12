// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_roles_update_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UserRolesUpdateRequest extends UserRolesUpdateRequest {
  @override
  final BuiltList<String> roles;

  factory _$UserRolesUpdateRequest(
          [void Function(UserRolesUpdateRequestBuilder)? updates]) =>
      (UserRolesUpdateRequestBuilder()..update(updates))._build();

  _$UserRolesUpdateRequest._({required this.roles}) : super._();
  @override
  UserRolesUpdateRequest rebuild(
          void Function(UserRolesUpdateRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserRolesUpdateRequestBuilder toBuilder() =>
      UserRolesUpdateRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserRolesUpdateRequest && roles == other.roles;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, roles.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserRolesUpdateRequest')
          ..add('roles', roles))
        .toString();
  }
}

class UserRolesUpdateRequestBuilder
    implements Builder<UserRolesUpdateRequest, UserRolesUpdateRequestBuilder> {
  _$UserRolesUpdateRequest? _$v;

  ListBuilder<String>? _roles;
  ListBuilder<String> get roles => _$this._roles ??= ListBuilder<String>();
  set roles(ListBuilder<String>? roles) => _$this._roles = roles;

  UserRolesUpdateRequestBuilder() {
    UserRolesUpdateRequest._defaults(this);
  }

  UserRolesUpdateRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _roles = $v.roles.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserRolesUpdateRequest other) {
    _$v = other as _$UserRolesUpdateRequest;
  }

  @override
  void update(void Function(UserRolesUpdateRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserRolesUpdateRequest build() => _build();

  _$UserRolesUpdateRequest _build() {
    _$UserRolesUpdateRequest _$result;
    try {
      _$result = _$v ??
          _$UserRolesUpdateRequest._(
            roles: roles.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'roles';
        roles.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UserRolesUpdateRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
