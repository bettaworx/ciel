// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'role_permissions.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RolePermissions extends RolePermissions {
  @override
  final String roleId;
  @override
  final BuiltList<PermissionOverride> permissions;

  factory _$RolePermissions([void Function(RolePermissionsBuilder)? updates]) =>
      (RolePermissionsBuilder()..update(updates))._build();

  _$RolePermissions._({required this.roleId, required this.permissions})
      : super._();
  @override
  RolePermissions rebuild(void Function(RolePermissionsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RolePermissionsBuilder toBuilder() => RolePermissionsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RolePermissions &&
        roleId == other.roleId &&
        permissions == other.permissions;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, roleId.hashCode);
    _$hash = $jc(_$hash, permissions.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RolePermissions')
          ..add('roleId', roleId)
          ..add('permissions', permissions))
        .toString();
  }
}

class RolePermissionsBuilder
    implements Builder<RolePermissions, RolePermissionsBuilder> {
  _$RolePermissions? _$v;

  String? _roleId;
  String? get roleId => _$this._roleId;
  set roleId(String? roleId) => _$this._roleId = roleId;

  ListBuilder<PermissionOverride>? _permissions;
  ListBuilder<PermissionOverride> get permissions =>
      _$this._permissions ??= ListBuilder<PermissionOverride>();
  set permissions(ListBuilder<PermissionOverride>? permissions) =>
      _$this._permissions = permissions;

  RolePermissionsBuilder() {
    RolePermissions._defaults(this);
  }

  RolePermissionsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _roleId = $v.roleId;
      _permissions = $v.permissions.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RolePermissions other) {
    _$v = other as _$RolePermissions;
  }

  @override
  void update(void Function(RolePermissionsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RolePermissions build() => _build();

  _$RolePermissions _build() {
    _$RolePermissions _$result;
    try {
      _$result = _$v ??
          _$RolePermissions._(
            roleId: BuiltValueNullFieldError.checkNotNull(
                roleId, r'RolePermissions', 'roleId'),
            permissions: permissions.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'permissions';
        permissions.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'RolePermissions', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
