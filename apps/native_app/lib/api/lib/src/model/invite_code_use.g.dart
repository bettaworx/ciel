// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invite_code_use.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InviteCodeUse extends InviteCodeUse {
  @override
  final String id;
  @override
  final String inviteCodeId;
  @override
  final String userId;
  @override
  final DateTime usedAt;
  @override
  final String username;
  @override
  final String? displayName;
  @override
  final String? avatarMediaId;

  factory _$InviteCodeUse([void Function(InviteCodeUseBuilder)? updates]) =>
      (InviteCodeUseBuilder()..update(updates))._build();

  _$InviteCodeUse._(
      {required this.id,
      required this.inviteCodeId,
      required this.userId,
      required this.usedAt,
      required this.username,
      this.displayName,
      this.avatarMediaId})
      : super._();
  @override
  InviteCodeUse rebuild(void Function(InviteCodeUseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InviteCodeUseBuilder toBuilder() => InviteCodeUseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InviteCodeUse &&
        id == other.id &&
        inviteCodeId == other.inviteCodeId &&
        userId == other.userId &&
        usedAt == other.usedAt &&
        username == other.username &&
        displayName == other.displayName &&
        avatarMediaId == other.avatarMediaId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, inviteCodeId.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, usedAt.hashCode);
    _$hash = $jc(_$hash, username.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, avatarMediaId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'InviteCodeUse')
          ..add('id', id)
          ..add('inviteCodeId', inviteCodeId)
          ..add('userId', userId)
          ..add('usedAt', usedAt)
          ..add('username', username)
          ..add('displayName', displayName)
          ..add('avatarMediaId', avatarMediaId))
        .toString();
  }
}

class InviteCodeUseBuilder
    implements Builder<InviteCodeUse, InviteCodeUseBuilder> {
  _$InviteCodeUse? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _inviteCodeId;
  String? get inviteCodeId => _$this._inviteCodeId;
  set inviteCodeId(String? inviteCodeId) => _$this._inviteCodeId = inviteCodeId;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  DateTime? _usedAt;
  DateTime? get usedAt => _$this._usedAt;
  set usedAt(DateTime? usedAt) => _$this._usedAt = usedAt;

  String? _username;
  String? get username => _$this._username;
  set username(String? username) => _$this._username = username;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _avatarMediaId;
  String? get avatarMediaId => _$this._avatarMediaId;
  set avatarMediaId(String? avatarMediaId) =>
      _$this._avatarMediaId = avatarMediaId;

  InviteCodeUseBuilder() {
    InviteCodeUse._defaults(this);
  }

  InviteCodeUseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _inviteCodeId = $v.inviteCodeId;
      _userId = $v.userId;
      _usedAt = $v.usedAt;
      _username = $v.username;
      _displayName = $v.displayName;
      _avatarMediaId = $v.avatarMediaId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InviteCodeUse other) {
    _$v = other as _$InviteCodeUse;
  }

  @override
  void update(void Function(InviteCodeUseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InviteCodeUse build() => _build();

  _$InviteCodeUse _build() {
    final _$result = _$v ??
        _$InviteCodeUse._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'InviteCodeUse', 'id'),
          inviteCodeId: BuiltValueNullFieldError.checkNotNull(
              inviteCodeId, r'InviteCodeUse', 'inviteCodeId'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'InviteCodeUse', 'userId'),
          usedAt: BuiltValueNullFieldError.checkNotNull(
              usedAt, r'InviteCodeUse', 'usedAt'),
          username: BuiltValueNullFieldError.checkNotNull(
              username, r'InviteCodeUse', 'username'),
          displayName: displayName,
          avatarMediaId: avatarMediaId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
