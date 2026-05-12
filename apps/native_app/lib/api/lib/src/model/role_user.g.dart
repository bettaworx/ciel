// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'role_user.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RoleUser extends RoleUser {
  @override
  final String id;
  @override
  final String username;
  @override
  final String? displayName;
  @override
  final String? avatarUrl;

  factory _$RoleUser([void Function(RoleUserBuilder)? updates]) =>
      (RoleUserBuilder()..update(updates))._build();

  _$RoleUser._(
      {required this.id,
      required this.username,
      this.displayName,
      this.avatarUrl})
      : super._();
  @override
  RoleUser rebuild(void Function(RoleUserBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RoleUserBuilder toBuilder() => RoleUserBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RoleUser &&
        id == other.id &&
        username == other.username &&
        displayName == other.displayName &&
        avatarUrl == other.avatarUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, username.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RoleUser')
          ..add('id', id)
          ..add('username', username)
          ..add('displayName', displayName)
          ..add('avatarUrl', avatarUrl))
        .toString();
  }
}

class RoleUserBuilder implements Builder<RoleUser, RoleUserBuilder> {
  _$RoleUser? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _username;
  String? get username => _$this._username;
  set username(String? username) => _$this._username = username;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _avatarUrl;
  String? get avatarUrl => _$this._avatarUrl;
  set avatarUrl(String? avatarUrl) => _$this._avatarUrl = avatarUrl;

  RoleUserBuilder() {
    RoleUser._defaults(this);
  }

  RoleUserBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _username = $v.username;
      _displayName = $v.displayName;
      _avatarUrl = $v.avatarUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RoleUser other) {
    _$v = other as _$RoleUser;
  }

  @override
  void update(void Function(RoleUserBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RoleUser build() => _build();

  _$RoleUser _build() {
    final _$result = _$v ??
        _$RoleUser._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'RoleUser', 'id'),
          username: BuiltValueNullFieldError.checkNotNull(
              username, r'RoleUser', 'username'),
          displayName: displayName,
          avatarUrl: avatarUrl,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
