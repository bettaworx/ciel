// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_permission_overrides.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UserPermissionOverrides extends UserPermissionOverrides {
  @override
  final BuiltList<PermissionOverride> overrides;

  factory _$UserPermissionOverrides(
          [void Function(UserPermissionOverridesBuilder)? updates]) =>
      (UserPermissionOverridesBuilder()..update(updates))._build();

  _$UserPermissionOverrides._({required this.overrides}) : super._();
  @override
  UserPermissionOverrides rebuild(
          void Function(UserPermissionOverridesBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserPermissionOverridesBuilder toBuilder() =>
      UserPermissionOverridesBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserPermissionOverrides && overrides == other.overrides;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, overrides.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserPermissionOverrides')
          ..add('overrides', overrides))
        .toString();
  }
}

class UserPermissionOverridesBuilder
    implements
        Builder<UserPermissionOverrides, UserPermissionOverridesBuilder> {
  _$UserPermissionOverrides? _$v;

  ListBuilder<PermissionOverride>? _overrides;
  ListBuilder<PermissionOverride> get overrides =>
      _$this._overrides ??= ListBuilder<PermissionOverride>();
  set overrides(ListBuilder<PermissionOverride>? overrides) =>
      _$this._overrides = overrides;

  UserPermissionOverridesBuilder() {
    UserPermissionOverrides._defaults(this);
  }

  UserPermissionOverridesBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _overrides = $v.overrides.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserPermissionOverrides other) {
    _$v = other as _$UserPermissionOverrides;
  }

  @override
  void update(void Function(UserPermissionOverridesBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserPermissionOverrides build() => _build();

  _$UserPermissionOverrides _build() {
    _$UserPermissionOverrides _$result;
    try {
      _$result = _$v ??
          _$UserPermissionOverrides._(
            overrides: overrides.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'overrides';
        overrides.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UserPermissionOverrides', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
