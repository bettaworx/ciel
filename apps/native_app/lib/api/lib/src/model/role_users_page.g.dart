// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'role_users_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RoleUsersPage extends RoleUsersPage {
  @override
  final String roleId;
  @override
  final BuiltList<RoleUser> users;
  @override
  final int total;

  factory _$RoleUsersPage([void Function(RoleUsersPageBuilder)? updates]) =>
      (RoleUsersPageBuilder()..update(updates))._build();

  _$RoleUsersPage._(
      {required this.roleId, required this.users, required this.total})
      : super._();
  @override
  RoleUsersPage rebuild(void Function(RoleUsersPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RoleUsersPageBuilder toBuilder() => RoleUsersPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RoleUsersPage &&
        roleId == other.roleId &&
        users == other.users &&
        total == other.total;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, roleId.hashCode);
    _$hash = $jc(_$hash, users.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RoleUsersPage')
          ..add('roleId', roleId)
          ..add('users', users)
          ..add('total', total))
        .toString();
  }
}

class RoleUsersPageBuilder
    implements Builder<RoleUsersPage, RoleUsersPageBuilder> {
  _$RoleUsersPage? _$v;

  String? _roleId;
  String? get roleId => _$this._roleId;
  set roleId(String? roleId) => _$this._roleId = roleId;

  ListBuilder<RoleUser>? _users;
  ListBuilder<RoleUser> get users => _$this._users ??= ListBuilder<RoleUser>();
  set users(ListBuilder<RoleUser>? users) => _$this._users = users;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  RoleUsersPageBuilder() {
    RoleUsersPage._defaults(this);
  }

  RoleUsersPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _roleId = $v.roleId;
      _users = $v.users.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RoleUsersPage other) {
    _$v = other as _$RoleUsersPage;
  }

  @override
  void update(void Function(RoleUsersPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RoleUsersPage build() => _build();

  _$RoleUsersPage _build() {
    _$RoleUsersPage _$result;
    try {
      _$result = _$v ??
          _$RoleUsersPage._(
            roleId: BuiltValueNullFieldError.checkNotNull(
                roleId, r'RoleUsersPage', 'roleId'),
            users: users.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'RoleUsersPage', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'users';
        users.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'RoleUsersPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
