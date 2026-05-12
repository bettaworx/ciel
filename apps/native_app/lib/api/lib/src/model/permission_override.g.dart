// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'permission_override.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PermissionOverride extends PermissionOverride {
  @override
  final String permissionId;
  @override
  final String scope;
  @override
  final PermissionEffect effect;

  factory _$PermissionOverride(
          [void Function(PermissionOverrideBuilder)? updates]) =>
      (PermissionOverrideBuilder()..update(updates))._build();

  _$PermissionOverride._(
      {required this.permissionId, required this.scope, required this.effect})
      : super._();
  @override
  PermissionOverride rebuild(
          void Function(PermissionOverrideBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PermissionOverrideBuilder toBuilder() =>
      PermissionOverrideBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PermissionOverride &&
        permissionId == other.permissionId &&
        scope == other.scope &&
        effect == other.effect;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, permissionId.hashCode);
    _$hash = $jc(_$hash, scope.hashCode);
    _$hash = $jc(_$hash, effect.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PermissionOverride')
          ..add('permissionId', permissionId)
          ..add('scope', scope)
          ..add('effect', effect))
        .toString();
  }
}

class PermissionOverrideBuilder
    implements Builder<PermissionOverride, PermissionOverrideBuilder> {
  _$PermissionOverride? _$v;

  String? _permissionId;
  String? get permissionId => _$this._permissionId;
  set permissionId(String? permissionId) => _$this._permissionId = permissionId;

  String? _scope;
  String? get scope => _$this._scope;
  set scope(String? scope) => _$this._scope = scope;

  PermissionEffect? _effect;
  PermissionEffect? get effect => _$this._effect;
  set effect(PermissionEffect? effect) => _$this._effect = effect;

  PermissionOverrideBuilder() {
    PermissionOverride._defaults(this);
  }

  PermissionOverrideBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _permissionId = $v.permissionId;
      _scope = $v.scope;
      _effect = $v.effect;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PermissionOverride other) {
    _$v = other as _$PermissionOverride;
  }

  @override
  void update(void Function(PermissionOverrideBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PermissionOverride build() => _build();

  _$PermissionOverride _build() {
    final _$result = _$v ??
        _$PermissionOverride._(
          permissionId: BuiltValueNullFieldError.checkNotNull(
              permissionId, r'PermissionOverride', 'permissionId'),
          scope: BuiltValueNullFieldError.checkNotNull(
              scope, r'PermissionOverride', 'scope'),
          effect: BuiltValueNullFieldError.checkNotNull(
              effect, r'PermissionOverride', 'effect'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
